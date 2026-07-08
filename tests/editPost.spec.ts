import { test } from '../fixtures/test.fixture';
import { hasCredentials, missingCredentialsMessage } from '../fixtures/auth.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniquePostText } from '../utils/randomData';

type EditPostData = {
  originalContent: string;
  updatedContentPrefix: string;
};

test.describe('post editing', () => {
  test('Edit Own Post Successfully', async ({ loginPage, createPostPage, postDetailPage, normalUserAuth, ownedPostSetup }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    const data = loadTestData<EditPostData>('editPostValid.json');
    const originalContent = ownedPostSetup.id ? ownedPostSetup.content : uniquePostText(data.originalContent);
    const updatedContent = uniquePostText(data.updatedContentPrefix);

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    if (ownedPostSetup.id) {
      await postDetailPage.gotoPost(ownedPostSetup.id);
    } else {
      await createPostPage.gotoComposer();
      await createPostPage.createTextPost(originalContent);
      await createPostPage.expectPostSubmitted(originalContent);
    }

    await postDetailPage.editPostContent(updatedContent);
    await postDetailPage.expectPostContent(updatedContent);
  });

  test('Attempt to Edit Another User\'s Post', async ({ loginPage, postDetailPage, userProfilePage, normalUserAuth, otherUserPostSetup }) => {
    test.skip(!hasCredentials(normalUserAuth), missingCredentialsMessage('E2E_NORMAL_USER'));
    test.skip(
      !otherUserPostSetup.id && !otherUserPostSetup.authorProfileKey,
      'Set E2E_OTHER_USER_POST_ID or E2E_OTHER_USER_POST_AUTHOR_PROFILE_KEY for the permission scenario.',
    );

    await loginPage.login(normalUserAuth.email, normalUserAuth.password, '/posts');
    if (otherUserPostSetup.id) {
      await postDetailPage.gotoPost(otherUserPostSetup.id);
    } else if (otherUserPostSetup.authorProfileKey) {
      await userProfilePage.gotoProfile(otherUserPostSetup.authorProfileKey);
      await userProfilePage.openPost(otherUserPostSetup.content);
    }

    await postDetailPage.expectEditUnavailable();
  });
});
