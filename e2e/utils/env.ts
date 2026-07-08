import fs from 'node:fs';
import path from 'node:path';

export type AppRole = 'normalUser' | 'adminUser' | 'secondaryUser';

export interface RoleCredentials {
  role: AppRole;
  email: string;
  password: string;
  handle?: string;
  displayName?: string;
}

export interface E2EConfig {
  baseUrl: string;
  apiBaseUrl: string;
  identityBaseUrl: string;
  oidcClientId: string;
  defaultHomeCountry: string;
  normalUser: RoleCredentials;
  adminUser: RoleCredentials;
  secondaryUser: RoleCredentials;
  existingUsername: string;
  reportReason: string;
}

const ENV_FILE_PATHS = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env.e2e'),
  path.resolve(process.cwd(), '.env.e2e.local'),
  path.resolve(process.cwd(), 'e2e/.env'),
  path.resolve(process.cwd(), 'e2e/.env.local'),
  path.resolve(process.cwd(), 'e2e/.env.e2e'),
  path.resolve(process.cwd(), 'e2e/.env.e2e.local'),
];

let cachedEnv: Record<string, string> | null = null;
let cachedConfig: E2EConfig | null = null;

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1));
    if (!key) {
      continue;
    }

    values[key] = value;
  }

  return values;
}

function loadEnvValues(): Record<string, string> {
  if (cachedEnv) {
    return cachedEnv;
  }

  const fileValues: Record<string, string> = {};

  for (const filePath of ENV_FILE_PATHS) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    Object.assign(fileValues, parseEnvFile(fs.readFileSync(filePath, 'utf8')));
  }

  cachedEnv = {
    ...fileValues,
    ...Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ),
  };

  return cachedEnv;
}

function requireEnv(name: string): string {
  const value = loadEnvValues()[name]?.trim();
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string, fallback = ''): string {
  return loadEnvValues()[name]?.trim() || fallback;
}

function buildRole(role: AppRole, prefix: string): RoleCredentials {
  return {
    role,
    email: requireEnv(`${prefix}_EMAIL`),
    password: requireEnv(`${prefix}_PASSWORD`),
    handle: optionalEnv(`${prefix}_HANDLE`) || undefined,
    displayName: optionalEnv(`${prefix}_DISPLAY_NAME`) || undefined,
  };
}

export function getE2EConfig(): E2EConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const normalUser = buildRole('normalUser', 'E2E_NORMAL_USER');
  const adminUser = buildRole('adminUser', 'E2E_ADMIN_USER');
  const secondaryUser = buildRole('secondaryUser', 'E2E_SECONDARY_USER');

  if (!normalUser.handle) {
    throw new Error('Missing required E2E environment variable: E2E_NORMAL_USER_HANDLE');
  }

  if (!secondaryUser.handle) {
    throw new Error('Missing required E2E environment variable: E2E_SECONDARY_USER_HANDLE');
  }

  cachedConfig = {
    baseUrl: requireEnv('E2E_BASE_URL'),
    apiBaseUrl: requireEnv('E2E_API_BASE_URL'),
    identityBaseUrl: requireEnv('E2E_IDENTITY_BASE_URL'),
    oidcClientId: optionalEnv('E2E_OIDC_CLIENT_ID', 'imriva-frontend'),
    defaultHomeCountry: optionalEnv('E2E_DEFAULT_HOME_COUNTRY', 'US'),
    normalUser,
    adminUser,
    secondaryUser,
    existingUsername:
      optionalEnv('E2E_EXISTING_USERNAME')
      || secondaryUser.handle
      || normalUser.handle
      || 'testuser',
    reportReason: optionalEnv(
      'E2E_REPORT_REASON',
      'Automated moderation seed for the Playwright admin review scenario.',
    ),
  };

  return cachedConfig;
}

export function resetCachedE2EConfig(): void {
  cachedEnv = null;
  cachedConfig = null;
}
