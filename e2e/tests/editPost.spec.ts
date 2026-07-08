import { test } from '../fixtures/test';
import { readTestData, uniqueSuffix } from '../utils/dataFactory';
import { ownProfileKey, seededTargetProfileKey } from '../utils/seed';
import { optionalEnv } from '../utils/env';

const editPostData = readTestData<{
  originalTextTemplate: string;
  updatedTextTemplate: string;
  otherUserPostTextEnv: string;
  otherUserPostText: string;
}>('test-data/posts/editPostData.json');

test.describe('edit post', () => {
  test('user edits own post successfully', async ({ normalUserAuth, homeFeedPage, createPostPage, postDetailPage, userProfilePage }) => {
    const suffix = uniqueSuffix('edit-post');
    const originalText = `${editPostData.originalTextTemplate} ${suffix}`;
    const updatedText = `${editPostData.updatedTextTemplate} ${suffix}`;

    await normalUserAuth.signIn();
    await homeFeedPage.goto();
    await homeFeedPage.openCreatePost();
    await createPostPage.createTextPost(originalText);
    await homeFeedPage.expectPostVisible(originalText);
    await homeFeedPage.postCardByText(originalText).click();

    await postDetailPage.editPostText(updatedText);
    await postDetailPage.expectEditedPostText(updatedText);

    await homeFeedPage.goto();
    await homeFeedPage.expectPostVisible(updatedText);
    await userProfilePage.gotoOwnProfile(ownProfileKey(normalUserAuth.credentials.profileSlug ?? normalUserAuth.credentials.userId ?? normalUserAuth.credentials.username));
    await userProfilePage.expectPostVisible(updatedText);
  });

  test('user cannot edit another user post', async ({ normalUserAuth, userProfilePage }) => {
    const otherUserPostText = optionalEnv(editPostData.otherUserPostTextEnv) ?? editPostData.otherUserPostText;

    await normalUserAuth.signIn();
    await userProfilePage.gotoProfile(seededTargetProfileKey());
    await userProfilePage.expectEditUnavailableForPost(otherUserPostText);
  });
});
