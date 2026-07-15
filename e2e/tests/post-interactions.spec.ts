import { test } from '../fixtures/test';

test('User likes, saves, opens comments, and opens an author profile from a feed post @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: stable seeded-post identifiers required for safe post-level scoping are not available in scoped sources',
  );
});

test('User shares and reports a feed post @medium', async () => {
  test.skip(
    true,
    'Missing selector in src/: share/report dialog selectors for this scenario are outside E2E_SCOPE.md selector sources',
  );
});
