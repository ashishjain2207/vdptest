import { env } from './test';

export const guestUser = {
  authenticated: false,
};

export const normalUserAuth = {
  emailEnv: 'E2E_USER_EMAIL',
  passwordEnv: 'E2E_USER_PASSWORD',
};

export const adminUserAuth = {
  emailEnv: 'E2E_ADMIN_EMAIL',
  passwordEnv: 'E2E_ADMIN_PASSWORD',
};

export const moderatorUserAuth = {
  emailEnv: 'E2E_MODERATOR_EMAIL',
  passwordEnv: 'E2E_MODERATOR_PASSWORD',
};

export function fixtureEnvValue(name: string): string | undefined {
  return env(name);
}
