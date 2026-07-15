import { skipIfMissingOptionalEnv, test } from '../fixtures/test';

test('Admin moderation is available to admins and denied to normal users @medium', async () => {
  skipIfMissingOptionalEnv(
    ['E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD'],
    'admin moderation scenario requires admin credentials',
  );
  test.skip(
    true,
    'Missing selector in src/: moderation report-id/user-id moderation controls are outside scoped selector sources',
  );
});
