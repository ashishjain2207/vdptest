import { test } from '../fixtures/test.fixture';
import { loadTestData } from '../utils/testDataLoader';
import { uniquePostText } from '../utils/randomData';

type EditPostData = {
  originalTextPrefix: string;
  updatedTextPrefix: string;
};

test.describe('Edit post', () => {
  test('Edit Own Post Successfully', async ({
    normalUserAuth,
    ownedPostSetup,
    userProfilePage,
    postDetailPage,
  }) => {
    const data = loadTestData<EditPostData>('test-data/editPostValid.json');
    const updatedText = uniquePostText(data.updatedTextPrefix);

    await normalUserAuth.login();
    if (ownedPostSetup.postId) {
      await postDetailPage.goToPost(ownedPostSetup.postId);
    } else {
      await userProfilePage.goToCurrentUserProfile();
      await userProfilePage.openPost(ownedPostSetup.content || data.originalTextPrefix);
    }
    await postDetailPage.editPostText(updatedText);
    await postDetailPage.expectPostText(updatedText);
    await postDetailPage.expectEditedIndicator();
    await userProfilePage.goToCurrentUserProfile();
    await userProfilePage.expectPostVisible(updatedText);
  });

  test('Attempt to Edit Another User Post', async ({
    normalUserAuth,
    otherUserSetup,
    otherUserPostSetup,
    userProfilePage,
    postDetailPage,
  }) => {
    await normalUserAuth.login();

    if (otherUserPostSetup.postPath) {
      await postDetailPage.goToPost(otherUserPostSetup.postId!);
      await postDetailPage.expectEditUnavailable();
    } else {
      await userProfilePage.goTo(otherUserSetup);
      await userProfilePage.expectEditUnavailableForPost(otherUserPostSetup.content);
    }
  });
});
