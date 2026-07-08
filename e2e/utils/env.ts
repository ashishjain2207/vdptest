import fs from 'node:fs';
import path from 'node:path';

type RoleCredentials = {
  email: string;
  password: string;
  username?: string;
  userId?: string;
  profileSlug?: string;
};

export type E2EConfig = {
  baseURL: string;
  normalUser: RoleCredentials;
  adminUser: RoleCredentials;
  targetUser: {
    username?: string;
    userId?: string;
    profileSlug?: string;
  };
  apiBaseURL?: string;
  reuseStorageState: boolean;
};

const ENV_FILES = ['.env', '.env.local', '.env.e2e'];

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
    return null;
  }

  const [rawKey, ...rawValueParts] = trimmed.split('=');
  const key = rawKey.trim();
  let value = rawValueParts.join('=').trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return key ? [key, value] : null;
}

export function loadLocalEnv(cwd = process.cwd()): void {
  for (const fileName of ENV_FILES) {
    const filePath = path.resolve(cwd, fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const contents = fs.readFileSync(filePath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) {
        continue;
      }
      const [key, value] = parsed;
      process.env[key] ??= value;
    }
  }
}

function valueFor(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

function requiredValue(name: string, aliases: string[] = []): string {
  const value = valueFor(name, ...aliases);
  if (!value) {
    const allNames = [name, ...aliases].join(' or ');
    throw new Error(`Missing required E2E environment variable: ${allNames}`);
  }
  return value;
}

export function getE2EConfig(): E2EConfig {
  loadLocalEnv();

  return {
    baseURL: requiredValue('PLAYWRIGHT_BASE_URL', ['E2E_BASE_URL']),
    apiBaseURL: valueFor('E2E_API_BASE_URL'),
    normalUser: {
      email: requiredValue('E2E_NORMAL_USER_EMAIL'),
      password: requiredValue('E2E_NORMAL_USER_PASSWORD'),
      username: valueFor('E2E_NORMAL_USER_USERNAME'),
      userId: valueFor('E2E_NORMAL_USER_ID'),
      profileSlug: valueFor('E2E_NORMAL_USER_PROFILE_SLUG'),
    },
    adminUser: {
      email: requiredValue('E2E_ADMIN_USER_EMAIL'),
      password: requiredValue('E2E_ADMIN_USER_PASSWORD'),
      username: valueFor('E2E_ADMIN_USER_USERNAME'),
      userId: valueFor('E2E_ADMIN_USER_ID'),
      profileSlug: valueFor('E2E_ADMIN_USER_PROFILE_SLUG'),
    },
    targetUser: {
      username: valueFor('E2E_TARGET_USER_USERNAME'),
      userId: valueFor('E2E_TARGET_USER_ID'),
      profileSlug: valueFor('E2E_TARGET_USER_PROFILE_SLUG'),
    },
    reuseStorageState: valueFor('E2E_REUSE_STORAGE_STATE') === 'true',
  };
}

export function optionalEnv(name: string): string | undefined {
  loadLocalEnv();
  return valueFor(name);
}

export function requireEnv(name: string): string {
  loadLocalEnv();
  return requiredValue(name);
}
