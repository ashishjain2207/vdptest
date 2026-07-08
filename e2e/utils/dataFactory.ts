import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEnv } from './env';

type JsonValue = Record<string, unknown>;

interface RegistrationTemplate {
  displayNamePrefix: string;
  handlePrefix: string;
  emailLocalPrefix: string;
  passwordFallback: string;
}

interface PostsTemplate {
  create: { contentPrefix: string };
  seed: { contentPrefix: string };
  edit: { updatedContentPrefix: string };
  delete: { contentPrefix: string };
  moderation: { blockedContentExample: string };
}

interface CommentsTemplate {
  create: { contentPrefix: string };
  edit: { contentPrefix: string };
}

interface ProfileTemplate {
  bioPrefix: string;
  companyPrefix: string;
  websiteDomain: string;
  descriptionPrefix: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.resolve(__dirname, '..', 'test-data');
const cache = new Map<string, JsonValue>();

function loadJson<T extends JsonValue>(name: string): T {
  if (!cache.has(name)) {
    const filePath = path.join(TEST_DATA_DIR, name);
    cache.set(name, JSON.parse(readFileSync(filePath, 'utf8')) as JsonValue);
  }
  return cache.get(name) as T;
}

function uniqueSuffix(): string {
  return `${Date.now()}-${randomUUID().slice(0, 8)}`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

export function getAccessControlRoutes(): { protectedRoutes: string[]; adminRoutes: string[] } {
  return loadJson<{ protectedRoutes: string[]; adminRoutes: string[] }>('access-control.json');
}

export function buildRegistrationUser() {
  const env = getEnv();
  const template = loadJson<RegistrationTemplate>('registration.json');
  const suffix = uniqueSuffix();
  const handle = slugify(`${template.handlePrefix}-${suffix}`).slice(0, 30);

  return {
    name: `${template.displayNamePrefix} ${suffix}`,
    handle,
    email: `${template.emailLocalPrefix}+${suffix}@${env.registrationEmailDomain}`,
    password: env.registrationPassword || template.passwordFallback,
    homeCountry: env.homeCountry,
  };
}

export function buildCreatePostData() {
  const template = loadJson<PostsTemplate>('posts.json');
  return {
    content: `${template.create.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildSeedPostData() {
  const template = loadJson<PostsTemplate>('posts.json');
  return {
    content: `${template.seed.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildEditPostData() {
  const template = loadJson<PostsTemplate>('posts.json');
  return {
    content: `${template.edit.updatedContentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildDeletePostData() {
  const template = loadJson<PostsTemplate>('posts.json');
  return {
    content: `${template.delete.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildModerationPlaceholder() {
  const template = loadJson<PostsTemplate>('posts.json');
  return template.moderation.blockedContentExample;
}

export function buildCommentCreateData() {
  const template = loadJson<CommentsTemplate>('comments.json');
  return {
    content: `${template.create.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildCommentEditData() {
  const template = loadJson<CommentsTemplate>('comments.json');
  return {
    content: `${template.edit.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildProfileUpdateData() {
  const template = loadJson<ProfileTemplate>('profile.json');
  const suffix = uniqueSuffix();
  return {
    bio: `${template.bioPrefix} ${suffix}`,
    company: `${template.companyPrefix} ${suffix.slice(0, 8)}`,
    description: `${template.descriptionPrefix} ${suffix}`,
    website: `https://${slugify(`playwright-${suffix}`)}.${template.websiteDomain}`,
  };
}
