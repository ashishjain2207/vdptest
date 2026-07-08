import { test, loginAs } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

test.describe('Edit profile', () => {
  test('Edit Profile with Invalid Website URL', async ({ page, normalUserAuth, editProfilePage }) => {
    const data = loadTestData<{ invalidUrl: string }>('invalidWebsiteUrl.json');

    await loginAs(page, normalUserAuth);
    await editProfilePage.gotoProfileSettings();
    await editProfilePage.setWebsite(data.invalidUrl);
    await editProfilePage.save();
    await editProfilePage.expectInvalidWebsiteValidation();
  });
});
