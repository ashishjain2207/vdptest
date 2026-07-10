import { test } from '../fixtures/auth';
import { CreatePostPage } from '../pages/CreatePostPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { loadTestData } from '../utils/testData';

type EditPostData = {
  originalText: string;
  updatedText: string;
  foreignUserId: string;
  foreignPostText: string;
};

const editPostData = loadTestData<EditPostData>('editPostData.json');

test.describe('edit post', () => {
  test('User edits own post successfully', async ({ page, normalUserAuth }) => {
    const createPostPage = new CreatePostPage(page);
    const postDetailPage = new PostDetailPage(page);
    const originalText = `${editPostData.originalText} ${Date.now()}`;
    const updatedText = `${editPostData.updatedText} ${Date.now()}`;

    await normalUserAuth();
    await page.goto('/posts');
    await createPostPage.openComposer();
    await createPostPage.enterPostText(originalText);
    await createPostPage.submit();

    await postDetailPage.editPostByContent(originalText, updatedText);
    await postDetailPage.expectPostContent(updatedText);
  });

  test('User cannot edit another user\'s post', async ({ page, normalUserAuth }) => {
    const userProfilePage = new UserProfilePage(page);

    await normalUserAuth();
    await userProfilePage.gotoUserProfile(editPostData.foreignUserId);
    await userProfilePage.expectNoEditOptionForPost(editPostData.foreignPostText);
  });
});
