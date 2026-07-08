import { test, expect, loginAs } from '../fixtures/test.fixture';

test.describe('Edit post', () => {
  test('Edit Own Post Successfully', async ({
    page,
    normalUserAuth,
    homeFeedPage,
    createPostPage,
    userProfilePage,
    ownedPostSetup,
  }) => {
    await loginAs(page, normalUserAuth);
    await homeFeedPage.gotoFeed();
    await createPostPage.createTextPost(ownedPostSetup.content);

    await userProfilePage.clickEditPost(ownedPostSetup.content);
    await page.getByRole('textbox', { name: /post content/i }).fill(ownedPostSetup.updatedContent);
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(ownedPostSetup.updatedContent).first()).toBeVisible();
  });

  test('Attempt to Edit Another User\'s Post', async ({
    page,
    normalUserAuth,
    postDetailPage,
    userProfilePage,
    otherUserPostSetup,
  }) => {
    await loginAs(page, normalUserAuth);

    if (otherUserPostSetup.id) {
      await postDetailPage.gotoPost(otherUserPostSetup.id);
      await postDetailPage.expectEditActionUnavailable();
      return;
    }

    await userProfilePage.gotoProfile(otherUserPostSetup.ownerUsername ?? '');
    await userProfilePage.expectEditUnavailableForPost(otherUserPostSetup.content);
  });
});
