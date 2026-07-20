import type { APIRequestContext, APIResponse } from '@playwright/test';

import { getEnv, type AuthRole, type E2EEnv, getRoleConfig } from './env';

export interface TokenBundle {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  obtained_at: number;
}

export interface RoleSession {
  role: AuthRole;
  tokens: TokenBundle;
  userInfo: Record<string, unknown> | null;
  userId: string | null;
}

export interface ProfileUpdatePayload {
  handle?: string;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  displayName?: string | null;
  contactEmail?: string | null;
  linkedInProfileUrl?: string | null;
  description?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
}

function apiUrl(pathname: string, env: E2EEnv): string {
  return `${env.apiBaseURL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveUserId(tokens: TokenBundle, userInfo: Record<string, unknown> | null): string | null {
  const payload = decodeJwtPayload(tokens.access_token);
  const candidate =
    payload?.sub
    ?? payload?.nameid
    ?? payload?.unique_name
    ?? userInfo?.sub
    ?? null;
  return candidate ? String(candidate) : null;
}

async function readJson<T>(response: APIResponse): Promise<T> {
  return (await response.json()) as T;
}

async function readErrorMessage(response: APIResponse): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const text = record.error_description ?? record.error ?? record.message ?? record.title ?? record.detail;
    if (typeof text === 'string' && text.trim()) {
      return text;
    }
  }
  return (await response.text().catch(() => response.statusText())).trim() || response.statusText();
}

async function expectOk(response: APIResponse, fallbackMessage: string): Promise<void> {
  if (response.ok()) {
    return;
  }
  throw new Error(`${fallbackMessage}: ${response.status()} ${await readErrorMessage(response)}`);
}

export async function loginWithPasswordGrant(
  request: APIRequestContext,
  role: AuthRole,
  env = getEnv(),
): Promise<TokenBundle> {
  const config = getRoleConfig(env, role);
  if (!config.isConfigured) {
    throw new Error(`Missing credentials for ${role}.`);
  }

  const form: Record<string, string> = {
    grant_type: 'password',
    username: config.username,
    password: config.password,
    client_id: env.oauthClientId,
    scope: env.oauthScope,
  };

  if (env.oauthClientSecret) {
    form.client_secret = env.oauthClientSecret;
  }

  const response = await request.post(env.oauthTokenURL, { form });
  await expectOk(response, `Password grant failed for ${role}`);

  const tokens = await readJson<Record<string, unknown>>(response);
  return {
    access_token: String(tokens.access_token),
    refresh_token: normalizeText(tokens.refresh_token) || undefined,
    expires_in: typeof tokens.expires_in === 'number' ? tokens.expires_in : undefined,
    token_type: normalizeText(tokens.token_type) || 'Bearer',
    obtained_at: Date.now(),
  };
}

export async function fetchUserInfo(
  request: APIRequestContext,
  accessToken: string,
  env = getEnv(),
): Promise<Record<string, unknown> | null> {
  const response = await request.get(env.oauthUserInfoURL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok()) {
    return null;
  }

  return await readJson<Record<string, unknown>>(response);
}

export async function createRoleSession(
  request: APIRequestContext,
  role: AuthRole,
  env = getEnv(),
): Promise<RoleSession> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const userInfo = await fetchUserInfo(request, tokens.access_token, env);
  return {
    role,
    tokens,
    userInfo,
    userId: resolveUserId(tokens, userInfo),
  };
}

export async function ensureOwnProfile(
  request: APIRequestContext,
  role: AuthRole,
  env = getEnv(),
  overrides: Record<string, unknown> = {},
): Promise<Record<string, unknown> | null> {
  const session = await createRoleSession(request, role, env);
  const handle = normalizeText(session.userInfo?.handle ?? session.userInfo?.preferred_handle);
  const email = normalizeText(session.userInfo?.email ?? session.userInfo?.Email ?? session.userInfo?.preferred_username);
  const displayName = normalizeText(
    session.userInfo?.display_name
      ?? session.userInfo?.displayName
      ?? session.userInfo?.name
      ?? session.userInfo?.given_name,
  );

  const response = await request.post(apiUrl('/api/Users/me/ensure-profile', env), {
    headers: {
      Authorization: `Bearer ${session.tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    data: {
      displayName: displayName || undefined,
      handle: handle || undefined,
      email: email || undefined,
      ...overrides,
    },
  });

  if (response.status() === 401) {
    return null;
  }

  await expectOk(response, `Failed to ensure profile for ${role}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function getProfileByUserId(
  request: APIRequestContext,
  userId: string,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const response = await request.get(apiUrl(`/api/Users/${encodeURIComponent(userId)}`, env));
  await expectOk(response, `Failed to load profile ${userId}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function getProfileByHandle(
  request: APIRequestContext,
  handle: string,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const response = await request.get(apiUrl(`/api/Users/handle/${encodeURIComponent(handle)}`, env));
  await expectOk(response, `Failed to load profile @${handle}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function getOwnProfile(
  request: APIRequestContext,
  role: AuthRole,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const session = await createRoleSession(request, role, env);
  if (!session.userId) {
    throw new Error(`Could not resolve user ID for ${role}.`);
  }
  return await getProfileByUserId(request, session.userId, env);
}

export async function createPostViaApi(
  request: APIRequestContext,
  role: AuthRole,
  content: string,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.post(apiUrl('/api/Posts', env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    multipart: {
      content,
      postType: 'Post',
    },
  });
  await expectOk(response, `Failed to create post for ${role}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function updatePostViaApi(
  request: APIRequestContext,
  role: AuthRole,
  postId: string,
  content: string,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.put(apiUrl(`/api/Posts/${encodeURIComponent(postId)}`, env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    multipart: {
      content,
      postType: 'Post',
    },
  });
  await expectOk(response, `Failed to update post ${postId}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function deletePostViaApi(
  request: APIRequestContext,
  role: AuthRole,
  postId: string,
  env = getEnv(),
): Promise<void> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.delete(apiUrl(`/api/Posts/${encodeURIComponent(postId)}`, env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (response.status() === 404) {
    return;
  }
  await expectOk(response, `Failed to delete post ${postId}`);
}

export async function createCommentViaApi(
  request: APIRequestContext,
  role: AuthRole,
  postId: string,
  content: string,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.post(apiUrl('/api/Comments', env), {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    data: {
      postId,
      parentCommentId: null,
      content,
    },
  });
  await expectOk(response, `Failed to create comment on ${postId}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function updateCommentViaApi(
  request: APIRequestContext,
  role: AuthRole,
  commentId: string,
  content: string,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.put(apiUrl(`/api/Comments/${encodeURIComponent(commentId)}`, env), {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    data: { content },
  });
  await expectOk(response, `Failed to update comment ${commentId}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function deleteCommentViaApi(
  request: APIRequestContext,
  role: AuthRole,
  commentId: string,
  env = getEnv(),
): Promise<void> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.delete(apiUrl(`/api/Comments/${encodeURIComponent(commentId)}`, env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (response.status() === 404) {
    return;
  }
  await expectOk(response, `Failed to delete comment ${commentId}`);
}

export async function followUserViaApi(
  request: APIRequestContext,
  role: AuthRole,
  targetUserId: string,
  env = getEnv(),
): Promise<void> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.post(apiUrl(`/api/follows/${encodeURIComponent(targetUserId)}`, env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  await expectOk(response, `Failed to follow ${targetUserId}`);
}

export async function unfollowUserViaApi(
  request: APIRequestContext,
  role: AuthRole,
  targetUserId: string,
  env = getEnv(),
): Promise<void> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.delete(apiUrl(`/api/follows/${encodeURIComponent(targetUserId)}`, env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (response.status() === 404) {
    return;
  }
  await expectOk(response, `Failed to unfollow ${targetUserId}`);
}

export async function updateOwnProfileViaApi(
  request: APIRequestContext,
  role: AuthRole,
  body: ProfileUpdatePayload,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.put(apiUrl('/api/Users', env), {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    data: body,
  });
  await expectOk(response, `Failed to update profile for ${role}`);
  return await readJson<Record<string, unknown>>(response);
}

export async function setHomeCountryViaApi(
  request: APIRequestContext,
  role: AuthRole,
  countryCode: string,
  env = getEnv(),
): Promise<void> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.put(apiUrl('/api/Users/me/home-country', env), {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    data: { countryCode: countryCode.toUpperCase() },
  });
  await expectOk(response, `Failed to save home country for ${role}`);
}

export async function listAdminUsersViaApi(
  request: APIRequestContext,
  role: Extract<AuthRole, 'admin'>,
  env = getEnv(),
  query = '',
): Promise<Record<string, unknown>> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const search = new URLSearchParams({ page: '1', pageSize: '20' });
  if (query.trim()) {
    search.set('q', query.trim());
  }
  const response = await request.get(apiUrl(`/api/admin/users?${search.toString()}`, env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  await expectOk(response, 'Failed to load admin users');
  return await readJson<Record<string, unknown>>(response);
}

export async function listModerationCasesViaApi(
  request: APIRequestContext,
  role: Extract<AuthRole, 'admin'>,
  env = getEnv(),
): Promise<Record<string, unknown>> {
  const tokens = await loginWithPasswordGrant(request, role, env);
  const response = await request.get(apiUrl('/api/admin/content-moderation', env), {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  await expectOk(response, 'Failed to load moderation cases');
  return await readJson<Record<string, unknown>>(response);
}

export function extractId(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value);
    }
  }
  return '';
}
