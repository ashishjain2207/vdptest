import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniqueComment, uniquePostText } from '../utils/randomData';

type CommentData = {
  content: string;
  commentPrefix: string;
};

test.describe('comments', () => {
  test('Add Comment to Post with Valid Text', async ({ loginPage, createPostPage, postDetailPage, normalUserAuth, commentPostSetup }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    const data = loadTestData<CommentData>('validComment.json');
    const comment = uniqueComment(data.commentPrefix);

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    if (commentPostSetup.id) {
      await postDetailPage.gotoPost(commentPostSetup.id);
    } else {
      await createPostPage.gotoComposer();
      await createPostPage.createTextPost(uniquePostText(data.content));
    }

    await postDetailPage.addComment(comment);
    await postDetailPage.expectCommentVisible(comment);
  });

  test('Add Empty Comment Should Fail', async ({ loginPage, createPostPage, postDetailPage, normalUserAuth, commentPostSetup }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    const data = loadTestData<CommentData>('validComment.json');

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    if (commentPostSetup.id) {
      await postDetailPage.gotoPost(commentPostSetup.id);
    } else {
      await createPostPage.gotoComposer();
      await createPostPage.createTextPost(uniquePostText(data.content));
    }

    await postDetailPage.submitEmptyComment();
    await postDetailPage.expectEmptyCommentValidation();
  });
});
