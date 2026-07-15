import { test } from '../fixtures/test';

test('User adds a comment, replies, and deletes their own comment @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: stable comment-id selectors required for scoped reply/delete assertions are not present in scoped sources',
  );
});

test('Comment form rejects empty and over-limit text @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: explicit comment-validation selectors for over-limit states are not included in scoped source files',
  );
});

test('Non-admin user cannot delete another user\'s comment @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: stable other-user comment selectors for permission assertions are not available in scoped sources',
  );
});
