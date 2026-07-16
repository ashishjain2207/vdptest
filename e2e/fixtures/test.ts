import { expect, test as base, type Page } from '@playwright/test';
import { captureHighPriorityFailureScreenshot } from './screenshots';

const UI_LANGUAGE_STORAGE_KEY = 'vdpconnect_language';

function resolveUiLanguage(): 'EN' | 'DE' {
  return env('E2E_LANGUAGE') === 'DE' ? 'DE' : 'EN';
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(
      ({ storageKey, language }) => {
        window.localStorage.setItem(storageKey, language);
      },
      { storageKey: UI_LANGUAGE_STORAGE_KEY, language: resolveUiLanguage() },
    );
    await use(context);
  },
});

test.afterEach(async ({ page }, testInfo) => {
  await captureHighPriorityFailureScreenshot(page, testInfo);
});

export { expect };

export function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function requireEnv(name: string): string {
  const value = env(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function skipIfMissingOptionalEnv(variableNames: string[], reason: string): void {
  const missing = variableNames.filter((variableName) => !env(variableName));
  if (missing.length > 0) {
    test.skip(true, `Skipped: ${missing.join('/')} not configured${reason ? ` — ${reason}` : ''}`);
  }
}

export async function loginWithDefaultUser(
  page: Page,
  login: {
    open: () => Promise<void>;
    fillCredentials: (email: string, password: string) => Promise<void>;
    submit: () => Promise<void>;
  },
): Promise<void> {
  const email = requireEnv('E2E_USER_EMAIL');
  const password = requireEnv('E2E_USER_PASSWORD');
  await login.open();
  await login.fillCredentials(email, password);
  await login.submit();
  await expect(page).toHaveURL(/\/posts(?:\?|$|\/)/);
  await expect(page.locator('main')).toBeVisible();
}
