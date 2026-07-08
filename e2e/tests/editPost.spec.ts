import { expect, test } from '../fixtures/test';
import { loadJsonFixture, resolveFixtureTokens, getOtherUserSeed } from '../utils/seed';
import { uniquePostText, uniqueSuffix } from '../utils/dataFactory';

interface EditPostData {
  originalContent: string;
  updatedContent: string;
}

const editPostTemplate = loadJsonFixture<EditPostData>('posts/editPostData.json');

test.describe('e2e/tests/editPost.spec.ts', () => {
  test('User edits own post successfully', async ({ normalUserAuth, makePages, appConfig }) => {
    const { homeFeedPage, createPostPage, userProfilePage, postDetailPage } = makePages(normalUserAuth.page);
    const originalContent = uniquePostText('IMRIVA editable post');
    const updatedContent = uniquePostText('IMRIVA edited post');
    const data = resolveFixtureTokens(editPostTemplate, {
      UNIQUE_SUFFIX: uniqueSuffix('edit-post'),
      ORIGINAL_POST_TEXT: originalContent,
      UPDATED_POST_TEXT: updatedContent,
    });

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.fillContent(data.originalContent || originalContent);
    await createPostPage.submit();
    await homeFeedPage.openPostByContent(data.originalContent || originalContent);
    await postDetailPage.expectLoaded();
    await postDetailPage.editPostFromMenu(data.updatedContent || updatedContent);
    await postDetailPage.expectPostContent(data.updatedContent || updatedContent);

    await homeFeedPage.goto();
    await homeFeedPage.expectPostVisible(data.updatedContent || updatedContent);

    if (appConfig.normalUser.profileKey) {
      await userProfilePage.goto(appConfig.normalUser.profileKey);
      await userProfilePage.expectPostVisible(data.updatedContent || updatedContent);
    }
  });

  test('User cannot edit another user\'s post', async ({ normalUserAuth, makePages }) => {
    const { userProfilePage } = makePages(normalUserAuth.page);
    const otherUser = getOtherUserSeed();

    await userProfilePage.goto(otherUser.profileKey);

    if (otherUser.postText) {
      await userProfilePage.expectPostMenuActionUnavailable(otherUser.postText, /edit/i);
      return;
    }

    const firstPost = userProfilePage.firstPostCard();
    await expect(firstPost).toBeVisible();
    await firstPost.getByRole('button', { name: /post actions/i }).click();
    await expect(normalUserAuth.page.getByRole('menuitem', { name: /edit/i })).toHaveCount(0);
  });
});
