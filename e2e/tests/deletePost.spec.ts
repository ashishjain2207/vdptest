import { test, loginAs } from '../fixtures/test.fixture';
import { uniquePostText } from '../utils/randomData';
import { loadTestData } from '../utils/testDataLoader';

test.describe('Delete post', () => {
  test('Delete Own Post with Confirmation', async ({
    page,
    normalUserAuth,
    homeFeedPage,
    createPostPage,
    userProfilePage,
  }) => {
    const data = loadTestData<{ contentPrefix: string }>('deletePost.json');
    const content = uniquePostText(data.contentPrefix);

    await loginAs(page, normalUserAuth);
    await homeFeedPage.gotoFeed();
    await createPostPage.createTextPost(content);
    await userProfilePage.clickDeletePost(content);
    await page.getByRole('button', { name: /^delete$/i }).click();
    await homeFeedPage.expectPostNotVisible(content);
  });
});
