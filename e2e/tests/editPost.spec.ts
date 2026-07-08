import { test } from '../fixtures/test';
import { uniquePostText } from '../utils/dataFactory';
import { ensureOtherUserPost, ensureOwnPost, ensureTargetUser } from '../utils/seed';
import editPostData from '../test-data/posts/editPostData.json';

test.describe('edit post', () => {
  test('User edits own post successfully', async ({
    request,
    normalUserAuth,
    userProfilePage,
    postDetailPage,
    homeFeedPage,
  }) => {
    const ownPost = await ensureOwnPost(request, editPostData.originalText);
    const updatedText = uniquePostText(editPostData.updatedTextPrefix);

    await normalUserAuth.signIn();
    await userProfilePage.gotoOwnProfile();
    await userProfilePage.openPost(ownPost.text);
    await postDetailPage.editPost(updatedText);

    await postDetailPage.expectPostText(updatedText);
    await postDetailPage.expectEditedIndicator();
    await homeFeedPage.goto();
    await homeFeedPage.expectPostVisible(updatedText);
    await userProfilePage.gotoOwnProfile();
    await userProfilePage.expectPostVisible(updatedText);
  });

  test("User cannot edit another user's post", async ({
    request,
    normalUserAuth,
    userProfilePage,
  }) => {
    const targetUser = await ensureTargetUser(request);
    const otherPost = await ensureOtherUserPost(request, 'Seeded other-user post for edit permission');

    await normalUserAuth.signIn();
    await userProfilePage.gotoUserProfile(targetUser.id ?? targetUser.username);

    await userProfilePage.expectPostVisible(otherPost.text);
    await userProfilePage.expectEditUnavailableForPost(otherPost.text);
  });
});
