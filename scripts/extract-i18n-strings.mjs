import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

const pairs = new Map();
const inline = new Map();
const keyRefs = new Map();

for (const f of walk('src')) {
  const c = fs.readFileSync(f, 'utf8');
  const re1 = /LangText\s+en="([^"]*)"\s+de="([^"]*)"/g;
  let m;
  while ((m = re1.exec(c))) {
    pairs.set(`${m[1]}|||${m[2]}`, (pairs.get(`${m[1]}|||${m[2]}`) || 0) + 1);
  }
  const re2 = /LangText\s+en=\{en\.([^}]+)\}\s+de=\{de\.([^}]+)\}/g;
  while ((m = re2.exec(c))) {
    keyRefs.set(m[1], (keyRefs.get(m[1]) || 0) + 1);
  }
  const re3 = /language === 'EN' \? '([^']*)' : '([^']*)'/g;
  while ((m = re3.exec(c))) {
    inline.set(`${m[1]}|||${m[2]}`, (inline.get(`${m[1]}|||${m[2]}`) || 0) + 1);
  }
  const re4 = /language === "EN" \? "([^"]*)" : "([^"]*)"/g;
  while ((m = re4.exec(c))) {
    inline.set(`${m[1]}|||${m[2]}`, (inline.get(`${m[1]}|||${m[2]}`) || 0) + 1);
  }
}

console.log(`=== LangText literal pairs (${pairs.size}) ===`);
[...pairs.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => console.log(`${v}\t${k}`));
console.log(`\n=== en/de key refs (${keyRefs.size}) ===`);
[...keyRefs.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => console.log(`${v}\t${k}`));
console.log(`\n=== Inline ternary pairs (${inline.size}) ===`);
[...inline.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => console.log(`${v}\t${k}`));
