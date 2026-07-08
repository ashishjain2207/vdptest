/**
 * One-shot i18n migration: build en/de dictionaries from extracted pairs and rewrite sources.
 * Run: node scripts/migrate-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');

// Import existing dictionaries (parse as text to avoid ESM issues with .js extension)
function loadDict(file) {
  const text = fs.readFileSync(path.join(srcDir, 'i18n', file), 'utf8');
  const match = text.match(/export const \w+ = (\{[\s\S]*\});/);
  if (!match) throw new Error(`Cannot parse ${file}`);
   
  return eval(`(${match[1]})`);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules', 'i18n'].includes(e.name)) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

function slugify(en) {
  return en
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

function flattenDict(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[v] = p;
    else if (v && typeof v === 'object') Object.assign(out, flattenDict(v, p));
  }
  return out;
}

function deepSet(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let node = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
}

function inferSection(en, filePath) {
  const rel = path.relative(srcDir, filePath).replace(/\\/g, '/');
  if (rel.includes('auth/') || /\/(Login|Signup|ForgotPassword|ResetPassword|VerifyEmail|Callback)\./.test(rel)) return 'auth';
  if (rel.includes('admin/') || /\/Admin/.test(rel)) return 'admin';
  if (rel.includes('post/') || /Post/.test(rel)) return 'posts';
  if (rel.includes('messages/') || /Messages/.test(rel)) return 'messages';
  if (rel.includes('partner/')) return 'partners';
  if (rel.includes('event/') || /Event/.test(rel)) return 'events';
  if (rel.includes('settings/')) return 'settings';
  if (rel.includes('maintenance/')) return 'maintenance';
  if (rel.includes('ads/')) return 'ads';
  if (rel.includes('profile/')) return 'profile';
  if (rel.includes('layout/')) return 'layout';
  if (rel.includes('notifications/') || /Notifications/.test(rel)) return 'notifications';
  if (/Explore/.test(rel)) return 'explore';
  if (/People/.test(rel)) return 'people';
  if (/Support/.test(rel)) return 'support';
  if (/NotFound|AccessDenied/.test(rel)) return 'errors';
  if (/Legal|Terms|Privacy|Cookie|Accessibility/.test(rel)) return 'legal';
  return 'common';
}

const en = loadDict('en.js');
const de = loadDict('de.js');

// Build reverse map en string -> path from existing dict
const enToPath = {};
for (const [enStr, p] of Object.entries(flattenDict(en))) enToPath[enStr] = p;

// Also map de strings to same path
const deFlat = {};
function flattenDe(obj, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') deFlat[p] = v;
    else flattenDe(v, p);
  }
}
flattenDe(de);

const pairToPath = new Map();

function registerPair(enStr, deStr, filePath) {
  if (!enStr || pairToPath.has(`${enStr}|||${deStr}`)) return;
  if (enToPath[enStr]) {
    pairToPath.set(`${enStr}|||${deStr}`, enToPath[enStr]);
    return;
  }
  const section = inferSection(enStr, filePath);
  let key = slugify(enStr);
  let pathKey = `${section}.${key}`;
  let n = 2;
  while (enToPath[enStr] === undefined) {
    // check collision
    const existing = Object.entries(enToPath).find(([, p]) => p === pathKey);
    if (existing && existing[0] !== enStr) {
      pathKey = `${section}.${key}_${n++}`;
    } else break;
  }
  deepSet(en, pathKey, enStr);
  deepSet(de, pathKey, deStr);
  enToPath[enStr] = pathKey;
  pairToPath.set(`${enStr}|||${deStr}`, pathKey);
}

// Extract and register all pairs
for (const f of walk(srcDir)) {
  const c = fs.readFileSync(f, 'utf8');
  const re1 = /LangText\s+en="([^"]*)"\s+de="([^"]*)"/g;
  let m;
  while ((m = re1.exec(c))) registerPair(m[1], m[2], f);
  const re3 = /language === 'EN' \? '([^']*)' : '([^']*)'/g;
  while ((m = re3.exec(c))) registerPair(m[1], m[2], f);
}

// Manual overrides for canonical terms and special keys
const overrides = {
  'Home': 'nav.home',
  'Startseite': 'nav.home',
  'Go to Dashboard': 'nav.home',
  'Zum Dashboard': 'nav.home',
  'Return to Dashboard': 'nav.home',
  'Go to dashboard': 'nav.home',
  'Admin Dashboard': 'nav.adminDashboard',
  'Admin-Dashboard': 'nav.adminDashboard',
  'Ads': 'nav.ads',
  'Anzeigen': 'nav.ads',
  'Conversations': 'nav.conversations',
  'Unterhaltungen': 'nav.conversations',
  'Saved posts': 'nav.savedPosts',
  'Gespeicherte Beiträge': 'nav.savedPosts',
  'Trending topics': 'explore.trendingTopics',
  'Trendthemen': 'explore.trendingTopics',
  'Search …': 'common.search',
  'Nach … suchen …': 'common.search',
};

for (const [enStr, pathKey] of Object.entries(overrides)) {
  enToPath[enStr] = pathKey;
}

function serializeDict(obj, indent = 2) {
  const pad = ' '.repeat(indent);
  const lines = ['{'];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      lines.push(`${pad}${k}: '${escaped}',`);
    } else {
      lines.push(`${pad}${k}: ${serializeDict(v, indent + 2)},`);
    }
  }
  lines.push(`${' '.repeat(indent - 2)}}`);
  return lines.join('\n');
}

// Write dictionaries
const enOut = `/** English UI strings (shared keys with de.js). */\nexport const en = ${serializeDict(en)};\n\nexport default en;\n`;
const deOut = `/** German UI strings (shared keys with de.js). */\nexport const de = ${serializeDict(de)};\n\nexport default de;\n`;
fs.writeFileSync(path.join(srcDir, 'i18n', 'en.js'), enOut);
fs.writeFileSync(path.join(srcDir, 'i18n', 'de.js'), deOut);

console.log('Wrote en.js and de.js');

// Rebuild pairToPath from full dict
pairToPath.clear();
function rebuildPairs(obj, deObj, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      const deVal = p.split('.').reduce((n, part) => n?.[part], deObj);
      if (typeof deVal === 'string') pairToPath.set(`${v}|||${deVal}`, p);
    } else rebuildPairs(v, deObj, p);
  }
}
rebuildPairs(en, de);

let filesChanged = 0;

for (const f of walk(srcDir)) {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;

  // LangText en={en.x} de={de.x} -> path
  c = c.replace(/<LangText\s+en=\{en\.([^}]+)\}\s+de=\{de\.([^}]+)\}([^/>]*)\/>/g,
    '<LangText path="$1"$3 />');
  c = c.replace(/<LangText\s+en=\{en\.([^}]+)\}\s+de=\{de\.([^}]+)\}([^>]*)>/g,
    '<LangText path="$1"$3>');

  // LangText en="..." de="..."
  c = c.replace(/<LangText\s+en="([^"]*)"\s+de="([^"]*)"([^/>]*)\/>/g, (_, enS, deS, rest) => {
    const p = pairToPath.get(`${enS}|||${deS}`) || enToPath[enS] || `common.${slugify(enS)}`;
    return `<LangText path="${p}"${rest} />`;
  });
  c = c.replace(/<LangText\s+en="([^"]*)"\s+de="([^"]*)"([^>]*)>/g, (_, enS, deS, rest) => {
    const p = pairToPath.get(`${enS}|||${deS}`) || enToPath[enS] || `common.${slugify(enS)}`;
    return `<LangText path="${p}"${rest}>`;
  });

  // LangText with template literals - skip for manual fix
  // language === 'EN' ? 'x' : 'y' in JSX text - replace simple cases
  c = c.replace(/language === 'EN' \? '([^']*)' : '([^']*)'/g, (_, enS, deS) => {
    const p = pairToPath.get(`${enS}|||${deS}`) || enToPath[enS];
    if (!p) return `language === 'EN' ? '${enS}' : '${deS}'`;
    return `t('${p}')`;
  });

  // Remove unused en, de imports from i18n when only used for LangText
  if (c !== orig) {
    // Add useT import if t() is used and not imported
    if (/\bt\('/.test(c) && !/useT|from '@\/i18n'/.test(c)) {
      if (/useLanguage/.test(c)) {
        c = c.replace(/from '@\/contexts\/LanguageContext';/, "from '@/contexts/LanguageContext';\nimport { useT } from '@/i18n';");
        if (!/const t = useT\(\)/.test(c)) {
          c = c.replace(/(const \{ language[^}]*\} = useLanguage\(\);)/, '$1\n  const t = useT();');
        }
      }
    }

    // Remove en, de imports if no longer referenced
    if (!/\ben\./.test(c) && !/\bde\./.test(c)) {
      c = c.replace(/import \{ en, de \} from '@\/i18n';\n?/g, '');
      c = c.replace(/import \{ en \} from '@\/i18n\/en';\n?/g, '');
      c = c.replace(/import \{ de \} from '@\/i18n\/de';\n?/g, '');
      c = c.replace(/import \{ en, de, useT \} from '@\/i18n';\n?/g, "import { useT } from '@/i18n';\n");
      c = c.replace(/import \{ en, de, searchPlaceholder \} from '@\/i18n';\n?/g, "import { searchPlaceholder } from '@/i18n';\n");
      c = c.replace(/import \{ en, de, t \} from '@\/i18n';\n?/g, "import { t, useT } from '@/i18n';\n");
    }

    fs.writeFileSync(f, c);
    filesChanged++;
  }
}

console.log(`Updated ${filesChanged} files`);
