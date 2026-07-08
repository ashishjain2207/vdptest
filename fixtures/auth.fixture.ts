import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loadTestData } from '../utils/testDataLoader';

export type E2EUserRole = 'normal' | 'admin' | 'existing' | 'other' | 'followed';

export type E2EUser = {
  email: string;
  password: string;
  username: string;
  displayName: string;
  userId: string;
  profilePath: string;
};

type CredentialReference = {
  role: E2EUserRole;
  emailEnv?: string;
  passwordEnv?: string;
  usernameEnv?: string;
  userIdEnv?: string;
  displayNameEnv?: string;
  email?: string;
  password?: string;
  username?: string;
  userId?: string;
  displayName?: string;
};

export type AuthFixtures = {
  normalUserAuth: E2EUser;
  adminUserAuth: E2EUser;
  guestUser: Page;
};

type CredentialField = 'email' | 'password' | 'username' | 'userId' | 'displayName';

const roleEnvPrefix: Record<E2EUserRole, string> = {
  normal: 'VDP_E2E_NORMAL_USER',
  admin: 'VDP_E2E_ADMIN_USER',
  existing: 'VDP_E2E_EXISTING_USER',
  other: 'VDP_E2E_OTHER_USER',
  followed: 'VDP_E2E_FOLLOWED_USER',
};

function readCredentialReference(role: E2EUserRole): CredentialReference {
  if (role === 'normal') {
    return loadTestData<CredentialReference>('validLogin.json');
  }
  if (role === 'existing') {
    return loadTestData<CredentialReference>('duplicateUsername.json');
  }
  return { role };
}

function valueFromEnvOrReference(reference: CredentialReference, field: CredentialField, suffix: string): string {
  const explicitEnvName = reference[`${field}Env` as keyof CredentialReference];
  const roleEnvName = `${roleEnvPrefix[reference.role]}_${suffix}`;
  return (
    (typeof explicitEnvName === 'string' ? process.env[explicitEnvName] : undefined) ??
    process.env[roleEnvName] ??
    (typeof reference[field] === 'string' ? reference[field] : '') ??
    ''
  );
}

export function getE2EUser(role: E2EUserRole): E2EUser {
  const reference = readCredentialReference(role);
  const username = valueFromEnvOrReference(reference, 'username', 'USERNAME');
  const userId = valueFromEnvOrReference(reference, 'userId', 'USER_ID');

  return {
    email: valueFromEnvOrReference(reference, 'email', 'EMAIL'),
    password: valueFromEnvOrReference(reference, 'password', 'PASSWORD'),
    username,
    userId,
    displayName: valueFromEnvOrReference(reference, 'displayName', 'DISPLAY_NAME') || username || userId,
    profilePath: userId ? `/profile/${encodeURIComponent(userId)}` : `/profile/${encodeURIComponent(username)}`,
  };
}

async function loginAs(page: Page, user: E2EUser, role: E2EUserRole): Promise<void> {
  if (!user.email || !user.password) {
    throw new Error(
      `Missing E2E credentials for ${user.displayName}. Set ${roleEnvPrefix[role]}_EMAIL and ${roleEnvPrefix[role]}_PASSWORD or the role-specific env vars referenced in test-data.`,
    );
  }
  await new LoginPage(page).login(user.email, user.password);
}

export const authTest = base.extend<AuthFixtures>({
  normalUserAuth: async ({ page }, use) => {
    const user = getE2EUser('normal');
    await loginAs(page, user, 'normal');
    await use(user);
  },

  adminUserAuth: async ({ page }, use) => {
    const user = getE2EUser('admin');
    await loginAs(page, user, 'admin');
    await use(user);
  },

  guestUser: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
