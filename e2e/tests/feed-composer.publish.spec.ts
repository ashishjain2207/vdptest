import { FeedComposerPage } from '../pages/feed-composer-page';
import { test, expect, loginAsAuthenticatedUser } from '../fixtures/test';
import { buildUniquePostText } from '../test-data/post-content';

function isCreatePostRequestUrl(url: string): boolean {
  const pathname = new URL(url).pathname.toLowerCase();
  return pathname.endsWith('/api/posts');
}

test('@high User can publish a text post from the feed composer', async ({ page, userEmail, userPassword }) => {
  await loginAsAuthenticatedUser(page, userEmail, userPassword);

  const composer = new FeedComposerPage(page);
  const postText = buildUniquePostText();

  await composer.openComposer();
  await composer.enterText(postText);

  const createPostRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && isCreatePostRequestUrl(request.url()),
  );
  const createPostResponsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && isCreatePostRequestUrl(response.url()),
  );

  await composer.publish();

  const [createPostRequest, createPostResponse] = await Promise.all([
    createPostRequestPromise,
    createPostResponsePromise,
  ]);

  expect(createPostResponse.ok()).toBeTruthy();

  const createPostBody =
    createPostRequest.postDataBuffer()?.toString('utf8') ??
    createPostRequest.postData() ??
    '';

  expect(createPostBody).toContain('name="postType"');
  expect(createPostBody).toMatch(/name="postType"\r?\n\r?\nPost\r?\n/);

  await expect(page.locator('article').filter({ hasText: postText }).first()).toBeVisible();
  await expect(composer.successToast).toBeVisible();
  await expect(composer.contentInput).toHaveValue('');
});
