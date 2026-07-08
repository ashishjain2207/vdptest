import { expect, test } from '../fixtures/test';
import { getCommentPermissionSeed } from '../utils/seed';
import { uniqueCommentText, uniquePostText } from '../utils/dataFactory';

test.describe('e2e/tests/comments.spec.ts', () => {
  test('User adds a valid comment to a post', async ({ normalUserAuth, makePages }) => {
    const { homeFeedPage, createPostPage, postDetailPage } = makePages(normalUserAuth.page);
    const postText = uniquePostText('Comment target post');
    const commentText = uniqueCommentText('Valid comment');

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.fillContent(postText);
    await createPostPage.submit();
    await homeFeedPage.openPostByContent(postText);
    await postDetailPage.expectLoaded();
    await postDetailPage.addComment(commentText);
    await postDetailPage.expectCommentVisible(commentText);
  });

  test('Comment submission fails with empty text', async ({ normalUserAuth, makePages }) => {
    const { homeFeedPage, createPostPage, postDetailPage } = makePages(normalUserAuth.page);
    const postText = uniquePostText('Empty comment validation post');

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.fillContent(postText);
    await createPostPage.submit();
    await homeFeedPage.openPostByContent(postText);
    await postDetailPage.expectLoaded();
    await postDetailPage.expectEmptyCommentBlocked();
  });

  test('User deletes own comment', async ({ normalUserAuth, makePages }) => {
    const { homeFeedPage, createPostPage, postDetailPage } = makePages(normalUserAuth.page);
    const postText = uniquePostText('Own comment delete target');
    const commentText = uniqueCommentText('Own removable comment');

    await homeFeedPage.goto();
    await homeFeedPage.expectLoaded();
    await createPostPage.fillContent(postText);
    await createPostPage.submit();
    await homeFeedPage.openPostByContent(postText);
    await postDetailPage.expectLoaded();
    await postDetailPage.addComment(commentText);
    await postDetailPage.expectCommentVisible(commentText);
    await postDetailPage.deleteCommentByText(commentText);
    await expect(normalUserAuth.page.getByText(commentText, { exact: false })).toHaveCount(0);
  });

  test('User cannot delete another user\'s comment unless admin', async ({ normalUserAuth, makePages, appConfig }) => {
    const { postDetailPage } = makePages(normalUserAuth.page);
    const seed = getCommentPermissionSeed();

    test.skip(!appConfig.seeds.otherUserCommentText, 'Set E2E_OTHER_USER_COMMENT_TEXT to assert comment delete permissions deterministically.');

    await postDetailPage.goto(seed.postId);
    await postDetailPage.expectLoaded();
    await postDetailPage.expectCommentDeleteUnavailable(seed.commentText ?? '');
  });
});
