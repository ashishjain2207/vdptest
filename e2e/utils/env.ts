import fs from 'node:fs';
import path from 'node:path';

type EnvLookup = {
  keys: string[];
  defaultValue?: string;
};

export type LoginCredentials = {
  identifier: string;
  email?: string;
  username?: string;
  password: string;
};

export type E2EConfig = {
  baseURL: string;
  apiBaseURL?: string;
  apiToken?: string;
  normalUser: {
    email?: string;
    username?: string;
    password?: string;
    userId?: string;
  };
  adminUser: {
    email?: string;
    username?: string;
    password?: string;
    userId?: string;
  };
  seeded: {
    duplicateUsername: string;
    targetUserId?: string;
    targetUsername?: string;
    ownPostId?: string;
    ownPostText?: string;
    otherPostId?: string;
    otherPostText?: string;
    reportedPostId?: string;
    reportedPostText?: string;
    commentPostId?: string;
    ownCommentId?: string;
    ownCommentText?: string;
    otherCommentId?: string;
    otherCommentText?: string;
    moderationUserId?: string;
    moderationUsername?: string;
  };
};

const repoRoot = process.cwd();

function parseDotEnv(contents: string): Record<string, string> {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');

      if (key) {
        acc[key] = value;
      }

      return acc;
    }, {});
}

export function loadE2EEnv(rootDir = repoRoot): void {
  [
    '.env',
    '.env.local',
    '.env.e2e',
    path.join('e2e', '.env'),
    path.join('e2e', '.env.local'),
  ].forEach((relativePath) => {
    const envPath = path.resolve(rootDir, relativePath);

    if (!fs.existsSync(envPath)) {
      return;
    }

    const parsed = parseDotEnv(fs.readFileSync(envPath, 'utf8'));

    Object.entries(parsed).forEach(([key, value]) => {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  });
}

function readEnv({ keys, defaultValue }: EnvLookup): string | undefined {
  const key = keys.find((candidate) => process.env[candidate]?.trim());
  return key ? process.env[key]?.trim() : defaultValue;
}

function requireValue(value: string | undefined, keys: string[]): string {
  if (value) {
    return value;
  }

  throw new Error(`Missing required E2E environment variable. Set one of: ${keys.join(', ')}`);
}

loadE2EEnv();

export const e2eConfig: E2EConfig = {
  baseURL: readEnv({
    keys: ['E2E_BASE_URL', 'PLAYWRIGHT_BASE_URL'],
    defaultValue: 'http://localhost:5173',
  })!,
  apiBaseURL: readEnv({ keys: ['E2E_API_BASE_URL', 'VITE_API_BASE_URL'] }),
  apiToken: readEnv({ keys: ['E2E_API_TOKEN'] }),
  normalUser: {
    email: readEnv({ keys: ['E2E_NORMAL_USER_EMAIL', 'E2E_USER_EMAIL'] }),
    username: readEnv({ keys: ['E2E_NORMAL_USER_USERNAME', 'E2E_USER_USERNAME'] }),
    password: readEnv({ keys: ['E2E_NORMAL_USER_PASSWORD', 'E2E_USER_PASSWORD'] }),
    userId: readEnv({ keys: ['E2E_NORMAL_USER_ID', 'E2E_USER_ID'] }),
  },
  adminUser: {
    email: readEnv({ keys: ['E2E_ADMIN_USER_EMAIL', 'E2E_PLATFORM_ADMIN_EMAIL'] }),
    username: readEnv({ keys: ['E2E_ADMIN_USER_USERNAME', 'E2E_PLATFORM_ADMIN_USERNAME'] }),
    password: readEnv({ keys: ['E2E_ADMIN_USER_PASSWORD', 'E2E_PLATFORM_ADMIN_PASSWORD'] }),
    userId: readEnv({ keys: ['E2E_ADMIN_USER_ID', 'E2E_PLATFORM_ADMIN_ID'] }),
  },
  seeded: {
    duplicateUsername: readEnv({
      keys: ['E2E_DUPLICATE_USERNAME'],
      defaultValue: 'testuser',
    })!,
    targetUserId: readEnv({ keys: ['E2E_TARGET_USER_ID'] }),
    targetUsername: readEnv({ keys: ['E2E_TARGET_USERNAME'] }),
    ownPostId: readEnv({ keys: ['E2E_OWN_POST_ID', 'E2E_EXISTING_POST_ID'] }),
    ownPostText: readEnv({ keys: ['E2E_OWN_POST_TEXT', 'E2E_EXISTING_POST_TEXT'] }),
    otherPostId: readEnv({ keys: ['E2E_OTHER_POST_ID'] }),
    otherPostText: readEnv({ keys: ['E2E_OTHER_POST_TEXT'] }),
    reportedPostId: readEnv({ keys: ['E2E_REPORTED_POST_ID'] }),
    reportedPostText: readEnv({ keys: ['E2E_REPORTED_POST_TEXT'] }),
    commentPostId: readEnv({ keys: ['E2E_COMMENT_POST_ID'] }),
    ownCommentId: readEnv({ keys: ['E2E_OWN_COMMENT_ID'] }),
    ownCommentText: readEnv({ keys: ['E2E_OWN_COMMENT_TEXT'] }),
    otherCommentId: readEnv({ keys: ['E2E_OTHER_COMMENT_ID'] }),
    otherCommentText: readEnv({ keys: ['E2E_OTHER_COMMENT_TEXT'] }),
    moderationUserId: readEnv({ keys: ['E2E_MODERATION_USER_ID', 'E2E_TARGET_ACCOUNT_ID'] }),
    moderationUsername: readEnv({ keys: ['E2E_MODERATION_USERNAME', 'E2E_TARGET_ACCOUNT_USERNAME'] }),
  },
};

export function requireNormalUserCredentials(): LoginCredentials {
  const password = requireValue(
    e2eConfig.normalUser.password,
    ['E2E_NORMAL_USER_PASSWORD', 'E2E_USER_PASSWORD'],
  );
  const identifier = e2eConfig.normalUser.username ?? e2eConfig.normalUser.email;

  return {
    identifier: requireValue(identifier, [
      'E2E_NORMAL_USER_USERNAME',
      'E2E_USER_USERNAME',
      'E2E_NORMAL_USER_EMAIL',
      'E2E_USER_EMAIL',
    ]),
    email: e2eConfig.normalUser.email,
    username: e2eConfig.normalUser.username,
    password,
  };
}

export function requireAdminUserCredentials(): LoginCredentials {
  const password = requireValue(
    e2eConfig.adminUser.password,
    ['E2E_ADMIN_USER_PASSWORD', 'E2E_PLATFORM_ADMIN_PASSWORD'],
  );
  const identifier = e2eConfig.adminUser.username ?? e2eConfig.adminUser.email;

  return {
    identifier: requireValue(identifier, [
      'E2E_ADMIN_USER_USERNAME',
      'E2E_PLATFORM_ADMIN_USERNAME',
      'E2E_ADMIN_USER_EMAIL',
      'E2E_PLATFORM_ADMIN_EMAIL',
    ]),
    email: e2eConfig.adminUser.email,
    username: e2eConfig.adminUser.username,
    password,
  };
}

export function requireSeedValue(value: string | undefined, envName: string): string {
  if (value) {
    return value;
  }

  throw new Error(`Missing seeded E2E precondition. Set ${envName} before running this scenario.`);
}
