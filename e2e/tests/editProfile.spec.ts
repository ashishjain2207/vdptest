import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

type InvalidWebsiteData = {
  url: string;
};

test.describe('Edit profile', () => {
  test('Edit Profile with Invalid Website URL', async ({ normalUserAuth, editProfilePage }) => {
    const data = loadTestData<InvalidWebsiteData>('test-data/invalidWebsiteUrl.json');

    await normalUserAuth.login();
    await editProfilePage.goTo();
    await editProfilePage.enterWebsiteUrl(data.url);
    await editProfilePage.save();
    await editProfilePage.expectInvalidWebsiteValidation();
  });
});
