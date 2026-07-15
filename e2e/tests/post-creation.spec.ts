import { test } from '../fixtures/test';

test('User creates a valid text post with selected visibility @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: scenario requires stable composer data-testid selectors that are not present in scoped source files',
  );
});

test('User creates supported image, video, and link posts @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: stable created-post verification selectors for media/link assertions are not documented in E2E scope',
  );
});

test('Post composer rejects empty, oversized, and unsupported submissions @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: stable validation selectors for over-limit and unsupported-media errors are not provided in scoped sources',
  );
});

test('User cancels post creation without publishing the draft @medium', async () => {
  test.skip(
    true,
    'Missing selector in src/: discard-confirmation selectors are not defined in scoped source files',
  );
});
