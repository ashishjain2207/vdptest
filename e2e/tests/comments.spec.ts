import { expect, test } from '../fixtures/test';
import { storageStatePaths } from '../fixtures/storageState';
import { createRuntimeTemplateTokens, interpolateFixtureData } from '../utils/dataFactory';
import { getE2EConfig } from '../utils/env';
import {
  createCommentForPost,
  createRoleSession,
  createTextPost,
  readJsonFixture,
} from '../utils/seed';

test.describe('comments', () => {
  test.use({ storageState: storageStatePaths.normalUser });

  test('User adds a valid comment to a post', async ({ postDetailPage, page }) => {
    const secondarySession = await createRoleSession(getE2EConfig().secondaryUser);
    const post = await createTextPost(secondarySession, `Comment host post ${Date.now()}`);
    const validCommentData = interpolateFixtureData(
      readJsonFixture<{ content: string }>('e2e/test-data/comments/validCommentData.json'),
      createRuntimeTemplateTokens('comment'),
    );

    try {
      await page.goto(`/posts/${String(post.id ?? '')}`);
      await postDetailPage.expectLoaded();
      await postDetailPage.addComment(validCommentData.content);
      await expect(postDetailPage.commentItemByText(validCommentData.content)).toBeVisible();
    } finally {
      await secondarySession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Posts/${String(post.id ?? '')}`).catch(() => undefined);
      await secondarySession.dispose();
    }
  });

  test('Comment submission fails with empty text', async ({ postDetailPage, page }) => {
    const secondarySession = await createRoleSession(getE2EConfig().secondaryUser);
    const post = await createTextPost(secondarySession, `Empty comment host ${Date.now()}`);

    try {
      await page.goto(`/posts/${String(post.id ?? '')}`);
      await postDetailPage.expectLoaded();
      await expect(postDetailPage.commentSubmitButton).toBeDisabled();
    } finally {
      await secondarySession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Posts/${String(post.id ?? '')}`).catch(() => undefined);
      await secondarySession.dispose();
    }
  });

  test('User deletes own comment', async ({ normalUserAuth, postDetailPage, page }) => {
    const normalSession = await normalUserAuth.createSession();
    const secondarySession = await createRoleSession(getE2EConfig().secondaryUser);
    const deleteCommentData = interpolateFixtureData(
      readJsonFixture<{ postContent: string; commentContent: string }>('e2e/test-data/comments/deleteCommentData.json'),
      createRuntimeTemplateTokens('delete-comment'),
    );

    try {
      const post = await createTextPost(secondarySession, deleteCommentData.postContent);
      const comment = await createCommentForPost(normalSession, String(post.id ?? ''), deleteCommentData.commentContent);

      await page.goto(`/posts/${String(post.id ?? '')}`);
      await postDetailPage.expectLoaded();
      await postDetailPage.openCommentActions(deleteCommentData.commentContent);
      await postDetailPage.deleteCommentAction().click();

      await expect(postDetailPage.commentItemByText(deleteCommentData.commentContent)).toHaveCount(0);

      await secondarySession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Posts/${String(post.id ?? '')}`).catch(() => undefined);
      await normalSession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Comments/${String(comment.id ?? '')}`).catch(() => undefined);
    } finally {
      await normalSession.dispose();
      await secondarySession.dispose();
    }
  });

  test('User cannot delete another user\'s comment unless admin', async ({ postDetailPage, page }) => {
    const secondarySession = await createRoleSession(getE2EConfig().secondaryUser);

    try {
      const post = await createTextPost(secondarySession, `Foreign comment host ${Date.now()}`);
      const foreignCommentText = `Foreign comment ${Date.now()}`;
      await createCommentForPost(secondarySession, String(post.id ?? ''), foreignCommentText);

      await page.goto(`/posts/${String(post.id ?? '')}`);
      await postDetailPage.expectLoaded();
      await postDetailPage.openCommentActions(foreignCommentText);
      await expect(postDetailPage.deleteCommentAction()).toHaveCount(0);

      await secondarySession.request.delete(`${getE2EConfig().apiBaseUrl}/api/Posts/${String(post.id ?? '')}`).catch(() => undefined);
    } finally {
      await secondarySession.dispose();
    }
  });
});
