import { test as base, expect } from '@playwright/test';

import { authFixtures, AuthFixtures } from './auth.fixtures';
import { pageFixtures, PageFixtures } from './page.fixtures';

export const test = base.extend<AuthFixtures & PageFixtures>({
  ...authFixtures,
  ...pageFixtures,
});

export { expect };
