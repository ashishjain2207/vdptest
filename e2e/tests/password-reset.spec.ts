import { test } from '../fixtures/test';

test('Password reset gives a security-safe response for existing and unknown email addresses @medium', async () => {
  test.skip(
    true,
    'Missing selector in src/: ForgotPassword page selectors are not included in E2E_SCOPE.md selector sources',
  );
});
