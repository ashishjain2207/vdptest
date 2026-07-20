import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEnv } from './env';

type JsonValue = Record<string, unknown>;

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
  return {
    protectedRoutes: ['/posts'],
    adminRoutes: ['/admin/users', '/admin/content-moderation'],
  };
}

export function buildRegistrationUser() {
  const env = getEnv();
  const template = loadJson<{
    fullNamePrefix: string;
    usernamePrefix: string;
    emailLocalPrefix: string;
    passwordFallback: string;
  }>('auth/validUserRegistrationData.json');
  const suffix = uniqueSuffix();
  const handle = slugify(`${template.usernamePrefix}-${suffix}`).slice(0, 30);

  return {
    name: `${template.fullNamePrefix} ${suffix}`,
    handle,
    email: `${template.emailLocalPrefix}+${suffix}@${env.registrationEmailDomain}`,
    password: env.registrationPassword || template.passwordFallback,
    homeCountry: env.homeCountry,
  };
}

export function getDuplicateUsernameData() {
  return loadJson<{
    fullName: string;
    username: string;
    emailLocalPrefix: string;
    passwordFallback: string;
  }>('auth/duplicateUsernameData.json');
}

export function getInvalidLoginData() {
  return loadJson<{
    password: string;
  }>('auth/invalidPasswordData.json');
}

export function getValidLoginData() {
  return loadJson<{
    usernameSource: 'env.primaryUser';
  }>('auth/validLoginData.json');
}

export function buildCreatePostData() {
  const template = loadJson<{ contentPrefix: string }>('posts/validTextPostData.json');
  return {
    content: `${template.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildSeedPostData() {
  const template = loadJson<{ contentPrefix: string }>('posts/validTextPostData.json');
  return {
    content: `${template.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildEditPostData() {
  const template = loadJson<{ originalContentPrefix: string; updatedContentPrefix: string }>('posts/editPostData.json');
  return {
    originalContent: `${template.originalContentPrefix} ${uniqueSuffix()}`,
    updatedContent: `${template.updatedContentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildDeletePostData() {
  const template = loadJson<{ contentPrefix: string }>('posts/deletePostData.json');
  return {
    content: `${template.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function getEmptyPostData() {
  return loadJson<{ content: string }>('posts/emptyPostData.json');
}

export function getUnsupportedMediaFileData() {
  return loadJson<{ fileName: string; expectedError: string }>('posts/unsupportedMediaFile.json');
}

export function buildCommentCreateData() {
  const template = loadJson<{ contentPrefix: string }>('comments/validCommentData.json');
  return {
    content: `${template.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildCommentEditData() {
  const template = loadJson<{ contentPrefix: string }>('comments/deleteCommentData.json');
  return {
    content: `${template.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function getEmptyCommentData() {
  return loadJson<{ content: string }>('comments/emptyCommentData.json');
}

export function buildDeleteCommentData() {
  const template = loadJson<{ contentPrefix: string }>('comments/deleteCommentData.json');
  return {
    content: `${template.contentPrefix} ${uniqueSuffix()}`,
  };
}

export function buildProfileUpdateData() {
  const template = loadJson<{
    displayNamePrefix: string;
    bioPrefix: string;
    websiteDomain: string;
    descriptionPrefix: string;
  }>('profile/validProfileUpdateData.json');
  const suffix = uniqueSuffix();
  return {
    displayName: `${template.displayNamePrefix} ${suffix.slice(0, 8)}`,
    bio: `${template.bioPrefix} ${suffix}`,
    description: `${template.descriptionPrefix} ${suffix}`,
    website: `https://${slugify(`playwright-${suffix}`)}.${template.websiteDomain}`,
  };
}

export function getInvalidWebsiteData() {
  return loadJson<{ website: string }>('profile/invalidWebsiteData.json');
}

export function getFollowUserData() {
  return loadJson<{ targetHandleSource: 'env.targetUserHandle' }>('profile/followUserData.json');
}

export function getReportedPostData() {
  return loadJson<{ targetSource: string }>('admin/reportedPostData.json');
}

export function getAdminUserAccountData() {
  return loadJson<{ targetSource: string }>('admin/userAccountData.json');
}

export function getInvalidProfilePicData() {
  return loadJson<{ fileName: string; expectedError: string }>('onboarding/invalidProfilePicFormat.json');
}
