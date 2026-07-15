import { test } from '../fixtures/test';

test('New user registers with valid required information @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: signup form does not expose verified date-of-birth, confirm-password, or terms selectors required by scenario',
  );
});

test('Registration rejects missing and malformed required values @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: signup scenario requires terms acceptance and date-of-birth validation selectors not present in scoped sources',
  );
});

test('Registration rejects duplicate username and email @high', async () => {
  test.skip(
    true,
    'Missing selector in src/: duplicate-email/duplicate-username flow requires full required-field coverage including non-scoped inputs',
  );
});
