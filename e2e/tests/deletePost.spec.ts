import { test } from '../fixtures/test';
import { readTestData } from '../utils/dataFactory';
import { ownProfileKey, runtimePostText, seededTargetProfileKey } from '../utils/seed';
import { optionalEnv } from '../utils/env';

const deletePostData = readTestData<{
  textTemplate: string;
  otherUserPostTextEnv: string;
  otherUserPostText: string;
}>('test-data/posts/deletePostData.json');

test.describe('delete post', () => {
  test('user deletes own post with confirmation', async ({ normalUserAuth, homeFeedPage, createPostPage, postDetailPage, userProfilePage }) => {
    const postText = runtimePostText(deletePostData);

    await normalUserAuth.signIn();
    await homeFeedPage.goto();
    await homeFeedPage.openCreatePost();
    await createPostPage.createTextPost(postText);
    await homeFeedPage.expectPostVisible(postText);

    await userProfilePage.gotoOwnProfile(ownProfileKey(normalUserAuth.credentials.profileSlug ?? normalUserAuth.credentials.userId ?? normalUserAuth.credentials.username));
    await userProfilePage.openPostByText(postText);
    await postDetailPage.deletePostWithConfirmation();
    await postDetailPage.expectPostDeletedConfirmation();

    await homeFeedPage.goto();
    await homeFeedPage.expectPostNotVisible(postText);
  });

  test('user cannot delete another user post', async ({ normalUserAuth, userProfilePage }) => {
    const otherUserPostText = optionalEnv(deletePostData.otherUserPostTextEnv) ?? deletePostData.otherUserPostText;

    await normalUserAuth.signIn();
    await userProfilePage.gotoProfile(seededTargetProfileKey());
    await userProfilePage.expectDeleteUnavailableForPost(otherUserPostText);
  });
});
