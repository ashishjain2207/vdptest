import { expect, test } from '../fixtures/test';
import { loadJsonFixture, getOtherUserSeed } from '../utils/seed';
import { uniquePostText } from '../utils/dataFactory';

interface DeletePostData {
  content: string;
}

loadJsonFixture<DeletePostData>('posts/deletePostData.json');

test.describe('e2e/tests/deletePost.spec.ts', () => {
  test('User deletes own post with confirmation', async ({ normalUserAuth, makePages, appConfig }) => {
    const { homeFeedPage, createPostPage, userProfilePage, postDetailPage } = makePages(normalUserAuth.page);
    const content = uniquePostText('IMRIVA deletable post');

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.fillContent(content);
    await createPostPage.submit();
    await homeFeedPage.openPostByContent(content);
    await postDetailPage.expectLoaded();
    await postDetailPage.deletePostFromMenu();
    await postDetailPage.confirmDeletion();

    await homeFeedPage.goto();
    await expect(homeFeedPage.postCardByContent(content)).toHaveCount(0);

    if (appConfig.normalUser.profileKey) {
      await userProfilePage.goto(appConfig.normalUser.profileKey);
      await userProfilePage.expectPostNotVisible(content);
    }
  });

  test('User cannot delete another user\'s post', async ({ normalUserAuth, makePages }) => {
    const { userProfilePage } = makePages(normalUserAuth.page);
    const otherUser = getOtherUserSeed();

    await userProfilePage.goto(otherUser.profileKey);

    if (otherUser.postText) {
      await userProfilePage.expectPostMenuActionUnavailable(otherUser.postText, /delete/i);
      return;
    }

    const firstPost = userProfilePage.firstPostCard();
    await expect(firstPost).toBeVisible();
    await firstPost.getByRole('button', { name: /post actions/i }).click();
    await expect(normalUserAuth.page.getByRole('menuitem', { name: /delete/i })).toHaveCount(0);
  });
});
