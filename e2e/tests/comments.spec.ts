import { test, loginAs } from '../fixtures/test.fixture';
import { uniqueComment, uniquePostText } from '../utils/randomData';
import { loadTestData } from '../utils/testDataLoader';

test.describe('Comments', () => {
  test.beforeEach(async ({ page, normalUserAuth, homeFeedPage }) => {
    await loginAs(page, normalUserAuth);
    await homeFeedPage.gotoFeed();
    await homeFeedPage.expectLoaded();
  });

  test('Add Comment to Post with Valid Text', async ({ page, createPostPage, postDetailPage }) => {
    const data = loadTestData<{ commentPrefix: string }>('validComment.json');
    const postContent = uniquePostText('E2E comment target post');
    const comment = uniqueComment(data.commentPrefix);

    await createPostPage.createTextPost(postContent);
    await page.getByText(postContent).first().click();
    await postDetailPage.addComment(comment);
  });

  test('Add Empty Comment Should Fail', async ({ page, createPostPage, postDetailPage }) => {
    const postContent = uniquePostText('E2E empty comment target post');

    await createPostPage.createTextPost(postContent);
    await page.getByText(postContent).first().click();
    await postDetailPage.expectEmptyCommentRejected();
  });
});
