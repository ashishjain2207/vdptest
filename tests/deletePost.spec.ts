import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniquePostText } from '../utils/randomData';

type DeletePostData = {
  contentPrefix: string;
};

test.describe('post deletion', () => {
  test('Delete Own Post with Confirmation', async ({ loginPage, createPostPage, postDetailPage, homeFeedPage, normalUserAuth }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    const data = loadTestData<DeletePostData>('deletePost.json');
    const content = uniquePostText(data.contentPrefix);

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    await createPostPage.gotoComposer();
    await createPostPage.createTextPost(content);
    await homeFeedPage.expectPostVisible(content);

    await postDetailPage.deletePostWithConfirmation();
    await homeFeedPage.expectPostHidden(content);
  });
});
