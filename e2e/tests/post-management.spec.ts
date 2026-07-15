import { test } from '../fixtures/test';

test('Post owner edits and then deletes a post with confirmation @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: stable owned-post identifiers needed to scope edit/delete actions are not in scoped selector sources',
  );
});

test('Non-owner cannot edit or delete another user\'s post @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: non-owner seeded-post selectors for permission assertions are not available in scoped source files',
  );
});
