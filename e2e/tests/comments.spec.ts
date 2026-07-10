import { test } from '../fixtures/auth';
import { PostDetailPage } from '../pages/PostDetailPage';
import { loadTestData } from '../utils/testData';

type ValidCommentData = {
  commentText: string;
};

type EmptyCommentData = {
  commentText: string;
};

type DeleteCommentData = {
  commentText: string;
  foreignCommentText: string;
};

const validCommentData = loadTestData<ValidCommentData>('validCommentData.json');
const emptyCommentData = loadTestData<EmptyCommentData>('emptyCommentData.json');
const deleteCommentData = loadTestData<DeleteCommentData>('deleteCommentData.json');

test.describe('comments', () => {
  test('User adds a valid comment to a post', async ({ page, normalUserAuth }) => {
    const postDetailPage = new PostDetailPage(page);
    const commentText = `${validCommentData.commentText} ${Date.now()}`;

    await normalUserAuth();
    await page.goto('/posts');
    await postDetailPage.addComment(commentText);

    await postDetailPage.expectCommentVisible(commentText);
  });

  test('Comment submission fails with empty text', async ({ page, normalUserAuth }) => {
    const postDetailPage = new PostDetailPage(page);

    await normalUserAuth();
    await page.goto('/posts');
    await postDetailPage.addComment(emptyCommentData.commentText);

    await postDetailPage.expectCommentValidationError();
  });

  test('User deletes own comment', async ({ page, normalUserAuth }) => {
    const postDetailPage = new PostDetailPage(page);
    const ownCommentText = `${deleteCommentData.commentText} ${Date.now()}`;

    await normalUserAuth();
    await page.goto('/posts');
    await postDetailPage.addComment(ownCommentText);
    await postDetailPage.expectCommentVisible(ownCommentText);
    await postDetailPage.deleteOwnComment(ownCommentText);
    await postDetailPage.expectPostNotVisible(ownCommentText);
  });

  test('User cannot delete another user\'s comment unless admin', async ({ page, normalUserAuth }) => {
    const postDetailPage = new PostDetailPage(page);

    await normalUserAuth();
    await page.goto('/posts');
    await postDetailPage.expectNoDeleteForForeignComment(deleteCommentData.foreignCommentText);
  });
});
