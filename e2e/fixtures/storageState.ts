import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { APIRequestContext, Page } from '@playwright/test';

import { absoluteAppUrl, getEnv, type AuthRole, type E2EEnv } from '../utils/env';
import { createRoleSession } from '../utils/seed';

export interface BrowserStorageState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Lax' | 'None' | 'Strict';
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.resolve(__dirname, '..', '.auth');

function buildSessionPayload() {
  const now = Date.now();
  return {
    lastActivity: now,
    loginTimestamp: now,
  };
}

function originFromBaseUrl(baseURL: string): string {
  return new URL(baseURL).origin;
}

export async function buildStorageState(
  request: APIRequestContext,
  role: AuthRole,
  env = getEnv(),
): Promise<BrowserStorageState> {
  const session = await createRoleSession(request, role, env);
  return {
    cookies: [],
    origins: [
      {
        origin: originFromBaseUrl(env.baseURL),
        localStorage: [
          {
            name: 'vdpconnect_tokens',
            value: JSON.stringify(session.tokens),
          },
          {
            name: 'vdpconnect_session',
            value: JSON.stringify(buildSessionPayload()),
          },
        ],
      },
    ],
  };
}

export async function ensureStorageStateFile(
  request: APIRequestContext,
  role: AuthRole,
  env = getEnv(),
): Promise<string> {
  await mkdir(AUTH_DIR, { recursive: true });
  const filePath = path.join(AUTH_DIR, `${role}.json`);
  const state = await buildStorageState(request, role, env);
  await writeFile(filePath, JSON.stringify(state, null, 2));
  return filePath;
}

export async function readStorageState(filePath: string): Promise<BrowserStorageState> {
  return JSON.parse(await readFile(filePath, 'utf8')) as BrowserStorageState;
}

export async function clearAuthStorage(page: Page, env: E2EEnv = getEnv()): Promise<void> {
  await page.goto(absoluteAppUrl('/login', env), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function hydratePageWithStorageState(
  page: Page,
  stateOrPath: BrowserStorageState | string,
  env: E2EEnv = getEnv(),
): Promise<void> {
  const state = typeof stateOrPath === 'string' ? await readStorageState(stateOrPath) : stateOrPath;
  const origin = originFromBaseUrl(env.baseURL);
  const localStorageEntries = state.origins.find((item) => item.origin === origin)?.localStorage ?? [];

  await clearAuthStorage(page, env);
  await page.evaluate(
    (entries) => {
      for (const entry of entries) {
        localStorage.setItem(entry.name, entry.value);
      }
    },
    localStorageEntries,
  );
}
