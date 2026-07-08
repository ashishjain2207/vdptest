import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { authTest } from './auth.fixtures';
import { createPageFixtures, type PageObjectFixtures } from './page.fixtures';
import { env, type E2EEnvironment } from '../utils/env';

export const test = authTest.extend<{
  appConfig: E2EEnvironment;
  makePages: (page: Page) => PageObjectFixtures;
}>({
  appConfig: async ({}, use) => {
    await use(env);
  },
  makePages: async ({}, use) => {
    await use((page: Page) => createPageFixtures(page));
  },
});

export { expect };
