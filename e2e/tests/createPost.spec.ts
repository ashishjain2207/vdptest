import { expect, test } from '../fixtures/test';
import { storageStatePaths } from '../fixtures/storageState';
import { createRuntimeTemplateTokens, interpolateFixtureData } from '../utils/dataFactory';
import { createCleanupManager } from '../utils/cleanup';
import { getE2EConfig } from '../utils/env';
import { readJsonFixture } from '../utils/seed';
import { uploadFiles } from '../utils/uploadFiles';

test.describe('create post', () => {
  test.use({ storageState: storageStatePaths.normalUser });

  test('User creates a valid text post', async ({ normalUserAuth, homeFeedPage, createPostPage, userProfilePage }) => {
    const cleanup = createCleanupManager();
    const session = await normalUserAuth.createSession();

    try {
      const postData = interpolateFixtureData(
        readJsonFixture<{ content: string }>('e2e/test-data/posts/validTextPostData.json'),
        createRuntimeTemplateTokens('post'),
      );

      await homeFeedPage.goto();
      await createPostPage.expectVisible();
      await createPostPage.publishTextPost(postData.content);

      await expect(homeFeedPage.postCardByText(postData.content)).toBeVisible();

      if (normalUserAuth.credentials.handle) {
        await userProfilePage.goto(normalUserAuth.credentials.handle);
        await expect(userProfilePage.postCardByText(postData.content)).toBeVisible();
      }

      const feedResponse = await session.request.get(`${getE2EConfig().apiBaseUrl}/api/Posts/feed?page=1&pageSize=20`);
      if (feedResponse.ok()) {
        const feedJson = (await feedResponse.json()) as { data?: Array<{ id?: string; content?: string }> };
        const createdPost = (feedJson.data ?? []).find((post) => post.content?.includes(postData.content));
        cleanup.trackPost(createdPost?.id ?? null);
      }
    } finally {
      await cleanup.run({ normalUserSession: session });
      await session.dispose();
    }
  });

  test('Post creation fails with empty text and no media', async ({ createPostPage, homeFeedPage }) => {
    await homeFeedPage.goto();
    await createPostPage.expectVisible();

    await expect(createPostPage.submitButton).toBeDisabled();
    await expect(createPostPage.composer).toBeVisible();
  });

  test('User uploads unsupported media file type in post', async ({ createPostPage, homeFeedPage, page }) => {
    const unsupportedMedia = readJsonFixture<{ expectedErrorPattern: string }>('e2e/test-data/posts/unsupportedMediaFile.json');

    await homeFeedPage.goto();
    await createPostPage.expectVisible();
    await createPostPage.uploadUnsupportedMedia(uploadFiles.unsupportedMedia);

    await expect(page.locator('body')).toContainText(new RegExp(unsupportedMedia.expectedErrorPattern, 'iu'));
  });
});
