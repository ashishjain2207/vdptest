import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';

type InvalidWebsiteData = {
  urls: string[];
};

test.describe('edit profile', () => {
  test('Edit Profile with Invalid Website URL', async ({ normalUserAuth, editProfilePage }) => {
    test.info().annotations.push({ type: 'user', description: normalUserAuth.email });
    const data = loadTestData<InvalidWebsiteData>('invalidWebsiteUrl.json');

    await editProfilePage.open();
    await editProfilePage.setWebsiteUrl(data.urls[0]);
    await editProfilePage.save();
    await editProfilePage.expectInvalidWebsiteValidation();
  });
});
