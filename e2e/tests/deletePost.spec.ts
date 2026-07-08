import { expect, test } from '../fixtures/test';
import { ensureOtherUserPost, ensureOwnPost, ensureTargetUser } from '../utils/seed';
import deletePostData from '../test-data/posts/deletePostData.json';

test.describe('delete post', () => {
  test('User deletes own post with confirmation', async ({
    request,
    normalUserAuth,
    userProfilePage,
    postDetailPage,
    homeFeedPage,
  }) => {
    const ownPost = await ensureOwnPost(request, deletePostData.text);

    await normalUserAuth.signIn();
    await userProfilePage.gotoOwnProfile();
    await userProfilePage.openPost(ownPost.text);
    await postDetailPage.deletePost();

    await postDetailPage.expectPostDeleted();
    await userProfilePage.gotoOwnProfile();
    await userProfilePage.expectPostNotVisible(ownPost.text);
    await homeFeedPage.goto();
    await expect(homeFeedPage.postCardByText(ownPost.text)).toBeHidden();
  });

  test("User cannot delete another user's post", async ({
    request,
    normalUserAuth,
    userProfilePage,
  }) => {
    const targetUser = await ensureTargetUser(request);
    const otherPost = await ensureOtherUserPost(request, 'Seeded other-user post for delete permission');

    await normalUserAuth.signIn();
    await userProfilePage.gotoUserProfile(targetUser.id ?? targetUser.username);

    await userProfilePage.expectPostVisible(otherPost.text);
    await userProfilePage.expectDeleteUnavailableForPost(otherPost.text);
  });
});
