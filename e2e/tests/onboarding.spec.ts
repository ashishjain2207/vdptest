import { test } from '../fixtures/test';

test('New user completes onboarding and reaches the feed @medium', async () => {
  test.skip(
    true,
    'Missing selector in src/: onboarding image-upload, interests, and suggested-user selectors are not present in scoped selector sources',
  );
});

test('User skips optional onboarding steps @low', async () => {
  test.skip(
    true,
    'Missing selector in src/: skip controls and optional onboarding-step selectors are not documented in scoped source files',
  );
});

test('Onboarding rejects a non-image profile-picture upload @medium', async () => {
  test.skip(
    true,
    'Missing selector in src/: onboarding file-upload and upload-error selectors are not available in scoped selector sources',
  );
});
