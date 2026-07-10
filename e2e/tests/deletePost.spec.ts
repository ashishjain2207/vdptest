import { test } from '../fixtures/auth';
import { CreatePostPage } from '../pages/CreatePostPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { loadTestData } from '../utils/testData';

type DeletePostData = {
  postText: string;
  foreignUserId: string;
  foreignPostText: string;
};

const deletePostData = loadTestData<DeletePostData>('deletePostData.json');

test.describe('delete post', () => {
  test('User deletes own post with confirmation', async ({ page, normalUserAuth }) => {
    const createPostPage = new CreatePostPage(page);
    const postDetailPage = new PostDetailPage(page);
    const postText = `${deletePostData.postText} ${Date.now()}`;

    await normalUserAuth();
    await page.goto('/posts');
    await createPostPage.openComposer();
    await createPostPage.enterPostText(postText);
    await createPostPage.submit();

    await postDetailPage.deletePostByContent(postText);
    await postDetailPage.expectPostNotVisible(postText);
  });

  test('User cannot delete another user\'s post', async ({ page, normalUserAuth }) => {
    const userProfilePage = new UserProfilePage(page);

    await normalUserAuth();
    await userProfilePage.gotoUserProfile(deletePostData.foreignUserId);
    await userProfilePage.expectNoDeleteOptionForPost(deletePostData.foreignPostText);
  });
});
