import { URL } from 'node:url';

export type AuthRole = 'user' | 'admin' | 'secondary' | 'onboarding';

export interface RoleConfig {
  username: string;
  password: string;
  handle: string;
  userId: string;
  isConfigured: boolean;
}

export interface E2EEnv {
  baseURL: string;
  apiBaseURL: string;
  oauthTokenURL: string;
  oauthUserInfoURL: string;
  oauthClientId: string;
  oauthClientSecret: string;
  oauthScope: string;
  homeCountry: string;
  registrationEmailDomain: string;
  registrationPassword: string;
  user: RoleConfig;
  admin: RoleConfig;
  secondary: RoleConfig;
  onboarding: RoleConfig;
  targetUserHandle: string;
  adminSuspendTargetUserId: string;
  adminSuspendTargetHandle: string;
  webServerCommand: string;
}

function read(name: string, fallback = ''): string {
  return (process.env[name] ?? fallback).trim();
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function buildUrl(baseUrl: string, pathname: string): string {
  return new URL(pathname, `${baseUrl}/`).toString();
}

function createRoleConfig(prefix: string): RoleConfig {
  const username = read(`${prefix}_USERNAME`);
  const password = read(`${prefix}_PASSWORD`);
  return {
    username,
    password,
    handle: read(`${prefix}_HANDLE`),
    userId: read(`${prefix}_USER_ID`),
    isConfigured: Boolean(username && password),
  };
}

let cachedEnv: E2EEnv | null = null;

export function getEnv(): E2EEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const baseURL = normalizeBaseUrl(read('E2E_BASE_URL', 'http://127.0.0.1:4173'));
  const apiBaseURL = normalizeBaseUrl(read('E2E_API_BASE_URL', baseURL));
  const oauthTokenURL = read('E2E_OAUTH_TOKEN_URL', buildUrl(baseURL, '/m/oauth2/token'));
  const oauthUserInfoURL = read(
    'E2E_OAUTH_USERINFO_URL',
    oauthTokenURL.replace(/\/connect\/token$/, '/connect/userinfo'),
  );

  const user = createRoleConfig('E2E_USER');
  const admin = createRoleConfig('E2E_ADMIN');
  const secondary = createRoleConfig('E2E_SECONDARY_USER');
  const onboarding = createRoleConfig('E2E_ONBOARDING_USER');

  cachedEnv = {
    baseURL,
    apiBaseURL,
    oauthTokenURL,
    oauthUserInfoURL,
    oauthClientId: read('E2E_OAUTH_CLIENT_ID', 'imriva-frontend'),
    oauthClientSecret: read('E2E_OAUTH_CLIENT_SECRET'),
    oauthScope: read('E2E_OAUTH_SCOPE', 'openid profile api market'),
    homeCountry: read('E2E_HOME_COUNTRY', 'DE').toUpperCase(),
    registrationEmailDomain: read('E2E_REGISTRATION_EMAIL_DOMAIN', 'example.test'),
    registrationPassword: read('E2E_REGISTRATION_PASSWORD', 'ChangeMe123!'),
    user,
    admin,
    secondary,
    onboarding,
    targetUserHandle: read('E2E_TARGET_USER_HANDLE', secondary.handle),
    adminSuspendTargetUserId: read('E2E_ADMIN_SUSPEND_TARGET_USER_ID'),
    adminSuspendTargetHandle: read(
      'E2E_ADMIN_SUSPEND_TARGET_HANDLE',
      secondary.handle || read('E2E_TARGET_USER_HANDLE'),
    ),
    webServerCommand: read('E2E_WEB_SERVER_COMMAND'),
  };

  return cachedEnv;
}

export function getRoleConfig(env: E2EEnv, role: AuthRole): RoleConfig {
  return env[role];
}

export function getRoleMissingReason(env: E2EEnv, role: AuthRole): string {
  const prefix =
    role === 'secondary'
      ? 'E2E_SECONDARY_USER'
      : role === 'onboarding'
        ? 'E2E_ONBOARDING_USER'
        : role === 'admin'
          ? 'E2E_ADMIN'
          : 'E2E_USER';
  const config = getRoleConfig(env, role);
  if (config.isConfigured) {
    return '';
  }
  return `Requires ${prefix}_USERNAME and ${prefix}_PASSWORD.`;
}

export function isAdminSuspendTargetConfigured(env: E2EEnv): boolean {
  return Boolean(env.adminSuspendTargetUserId || env.adminSuspendTargetHandle);
}

export function absoluteAppUrl(pathname: string, env = getEnv()): string {
  return buildUrl(env.baseURL, pathname.startsWith('/') ? pathname : `/${pathname}`);
}
