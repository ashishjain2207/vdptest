import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';
import { loadTestData } from '../utils/testDataLoader';

type InvalidWebsiteData = {
  invalidUrl: string;
};

test.describe('edit profile', () => {
  test('Edit Profile with Invalid Website URL', async ({ loginPage, editProfilePage, normalUserAuth }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    const data = loadTestData<InvalidWebsiteData>('invalidWebsiteUrl.json');

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/settings/profile');
    await editProfilePage.gotoEditProfile();
    await editProfilePage.setWebsiteUrl(data.invalidUrl);
    await editProfilePage.save();

    await editProfilePage.expectInvalidWebsiteValidation();
  });
});
