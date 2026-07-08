import fs from 'node:fs';
import path from 'node:path';
import { request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext, Browser } from '@playwright/test';
import { getE2EConfig, type RoleCredentials } from './env';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface AuthenticatedSession {
  credentials: RoleCredentials;
  request: APIRequestContext;
  tokens: TokenResponse;
  userId: string;
  handle?: string;
  dispose: () => Promise<void>;
}

interface RegistrationPayload {
  email: string;
  password: string;
  displayName: string;
  handle: string;
}

function apiUrl(pathname: string): string {
  return new URL(pathname, `${getE2EConfig().apiBaseUrl}/`).toString();
}

function identityUrl(pathname: string): string {
  return new URL(pathname, `${getE2EConfig().identityBaseUrl}/`).toString();
}

function sessionStoragePayload(tokens: TokenResponse): string {
  return JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    token_type: tokens.token_type,
    obtained_at: Date.now(),
  });
}

function localSessionPayload(): string {
  const now = Date.now();
  return JSON.stringify({
    lastActivity: now,
    loginTimestamp: now,
  });
}

export function readJsonFixture<T>(fixturePath: string): T {
  const absolutePath = path.resolve(process.cwd(), fixturePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

async function loginWithPassword(
  credentials: RoleCredentials,
): Promise<TokenResponse> {
  const context = await playwrightRequest.newContext();

  try {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: getE2EConfig().oidcClientId,
      scope: 'openid profile api',
      username: credentials.email,
      password: credentials.password,
    });

    const response = await context.post(identityUrl('/connect/token'), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: body.toString(),
    });

    if (!response.ok()) {
      throw new Error(`Password grant failed for ${credentials.role}: ${response.status()} ${await response.text()}`);
    }

    return (await response.json()) as TokenResponse;
  } finally {
    await context.dispose();
  }
}

async function createAuthorizedRequestContext(
  credentials: RoleCredentials,
): Promise<AuthenticatedSession> {
  const tokens = await loginWithPassword(credentials);
  const request = await playwrightRequest.newContext({
    extraHTTPHeaders: {
      Authorization: `Bearer ${tokens.access_token}`,
      'X-Country-Code': getE2EConfig().defaultHomeCountry,
    },
  });

  const userInfoResponse = await request.get(identityUrl('/connect/userinfo'));
  if (!userInfoResponse.ok()) {
    await request.dispose();
    throw new Error(`userinfo failed for ${credentials.role}: ${userInfoResponse.status()}`);
  }

  const userInfo = (await userInfoResponse.json()) as { sub?: string; handle?: string };
  if (!userInfo.sub) {
    await request.dispose();
    throw new Error(`Missing user id in userinfo response for ${credentials.role}`);
  }

  return {
    credentials,
    request,
    tokens,
    userId: userInfo.sub,
    handle: credentials.handle ?? userInfo.handle ?? undefined,
    dispose: async () => {
      await request.dispose();
    },
  };
}

export async function createRoleSession(
  credentials: RoleCredentials,
): Promise<AuthenticatedSession> {
  return createAuthorizedRequestContext(credentials);
}

export async function ensureStorageStateForRole(
  browser: Browser,
  credentials: RoleCredentials,
  storageStatePath: string,
): Promise<void> {
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  if (fs.existsSync(storageStatePath)) {
    return;
  }

  const tokens = await loginWithPassword(credentials);
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(getE2EConfig().baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ({ tokenPayload, sessionPayload }) => {
        window.localStorage.setItem('vdpconnect_tokens', tokenPayload);
        window.localStorage.setItem('vdpconnect_session', sessionPayload);
      },
      {
        tokenPayload: sessionStoragePayload(tokens),
        sessionPayload: localSessionPayload(),
      },
    );
    await context.storageState({ path: storageStatePath });
  } finally {
    await context.close();
  }
}

export async function createAdHocStorageState(
  browser: Browser,
  credentials: RoleCredentials,
  storageStatePath: string,
): Promise<void> {
  if (fs.existsSync(storageStatePath)) {
    fs.unlinkSync(storageStatePath);
  }

  await ensureStorageStateForRole(browser, credentials, storageStatePath);
}

export async function registerUser(
  payload: RegistrationPayload,
): Promise<{ status: number; body: unknown }> {
  const context = await playwrightRequest.newContext();

  try {
    const response = await context.post(identityUrl('/api/register'), {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      status: response.status(),
      body: await response.json().catch(async () => response.text()),
    };
  } finally {
    await context.dispose();
  }
}

export async function fetchUserByHandle(
  request: APIRequestContext,
  handle: string,
): Promise<{ status: number; body: unknown }> {
  const response = await request.get(apiUrl(`/api/Users/handle/${encodeURIComponent(handle)}`));
  return {
    status: response.status(),
    body: await response.json().catch(async () => response.text()),
  };
}

export async function createTextPost(
  session: AuthenticatedSession,
  content: string,
): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('postType', 'Post');

  const response = await session.request.post(apiUrl('/api/Posts'), {
    multipart: {
      content,
      postType: 'Post',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create post: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function deletePostById(
  session: AuthenticatedSession,
  postId: string,
  reason?: string,
): Promise<void> {
  const response = await session.request.delete(apiUrl(`/api/Posts/${postId}`), reason
    ? {
        data: { reason },
        headers: { 'Content-Type': 'application/json' },
      }
    : undefined);

  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete post ${postId}: ${response.status()} ${await response.text()}`);
  }
}

export async function createCommentForPost(
  session: AuthenticatedSession,
  postId: string,
  content: string,
  parentCommentId?: string,
): Promise<Record<string, unknown>> {
  const response = await session.request.post(apiUrl('/api/Comments'), {
    data: {
      postId,
      parentCommentId: parentCommentId ?? null,
      content,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create comment: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function deleteCommentById(
  session: AuthenticatedSession,
  commentId: string,
): Promise<void> {
  const response = await session.request.delete(apiUrl(`/api/Comments/${commentId}`));
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Failed to delete comment ${commentId}: ${response.status()} ${await response.text()}`);
  }
}

export async function submitContentReport(
  session: AuthenticatedSession,
  contentType: 'Post' | 'Comment' | 'User',
  contentId: string,
  reason: string,
): Promise<Record<string, unknown>> {
  const response = await session.request.post(apiUrl('/api/content-reports'), {
    data: {
      contentType,
      contentId,
      reason,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to submit content report: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function saveHomeCountry(
  session: AuthenticatedSession,
  countryCode: string,
): Promise<void> {
  const response = await session.request.put(apiUrl('/api/Users/me/home-country'), {
    data: {
      countryCode,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to save home country: ${response.status()} ${await response.text()}`);
  }
}

export async function listModerationCases(
  session: AuthenticatedSession,
  filters: { status?: string; contentType?: string } = {},
): Promise<Record<string, unknown>> {
  const search = new URLSearchParams();
  if (filters.status) {
    search.set('status', filters.status);
  }
  if (filters.contentType) {
    search.set('contentType', filters.contentType);
  }

  const response = await session.request.get(
    apiUrl(`/api/admin/content-moderation${search.size ? `?${search.toString()}` : ''}`),
  );

  if (!response.ok()) {
    throw new Error(`Failed to list moderation cases: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as Record<string, unknown>;
}
