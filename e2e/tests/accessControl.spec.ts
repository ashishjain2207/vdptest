import { test, expect } from '../fixtures/test';
import { getAccessControlRoutes } from '../utils/dataFactory';
import { getRoleMissingReason } from '../utils/env';

test.describe('access control', () => {
  test('redirects unauthenticated visitors to login for protected routes', async ({ page, loginPage }) => {
    const { protectedRoutes } = getAccessControlRoutes();

    for (const route of protectedRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/login$/);
      await loginPage.expectLoaded();
    }
  });

  test('blocks regular users from admin-only pages', async ({ auth, env, page }) => {
    test.skip(!env.user.isConfigured, getRoleMissingReason(env, 'user'));

    const { adminRoutes } = getAccessControlRoutes();

    await auth.loginAsPrimaryUser('/posts');

    for (const route of adminRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/access-denied$/);
    }
  });
});
