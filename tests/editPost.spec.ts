import { test } from '../fixtures/test.fixture';

test.describe('edit post', () => {
  test('Edit Own Post Successfully', async ({
    normalUserAuth,
    homeFeedPage,
    createPostPage,
    userProfilePage,
    postDetailPage,
    ownedPostSetup,
  }) => {
    test.skip(!normalUserAuth.userId && !normalUserAuth.username, 'Set normal user profile identifiers for own-profile navigation.');

    await homeFeedPage.open();
    await createPostPage.createTextPost(ownedPostSetup.content);
    await userProfilePage.openProfile(normalUserAuth.userId || normalUserAuth.username);
    await userProfilePage.openPost(ownedPostSetup.content);
    await postDetailPage.editPost(ownedPostSetup.updatedContent ?? ownedPostSetup.content);
  });

  test('Attempt to Edit Another User\'s Post', async ({ normalUserAuth, userProfilePage, postDetailPage, otherUserPostSetup }) => {
    test.info().annotations.push({ type: 'user', description: normalUserAuth.email });
    test.skip(!otherUserPostSetup.postPath, 'Set VDP_E2E_OTHER_USER_POST_PATH or other user identifiers for permission validation.');
    const postPath = otherUserPostSetup.postPath ?? '';

    await userProfilePage.goto(postPath);
    if (!/\/posts\//.test(postPath)) {
      await userProfilePage.openPost(otherUserPostSetup.content);
    }
    await postDetailPage.expectCannotEditPost();
  });
});
