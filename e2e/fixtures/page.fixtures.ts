import { test as authTest, expect } from './auth.fixtures';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { CreatePostPage } from '../pages/CreatePostPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { LoginPage } from '../pages/LoginPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { UserProfilePage } from '../pages/UserProfilePage';

interface PageFixtures {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  homeFeedPage: HomeFeedPage;
  createPostPage: CreatePostPage;
  userProfilePage: UserProfilePage;
  postDetailPage: PostDetailPage;
  adminPanelPage: AdminPanelPage;
  editProfilePage: EditProfilePage;
  onboardingPage: OnboardingPage;
}

export const test = authTest.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registrationPage: async ({ page }, use) => use(new RegistrationPage(page)),
  homeFeedPage: async ({ page }, use) => use(new HomeFeedPage(page)),
  createPostPage: async ({ page }, use) => use(new CreatePostPage(page)),
  userProfilePage: async ({ page }, use) => use(new UserProfilePage(page)),
  postDetailPage: async ({ page }, use) => use(new PostDetailPage(page)),
  adminPanelPage: async ({ page }, use) => use(new AdminPanelPage(page)),
  editProfilePage: async ({ page }, use) => use(new EditProfilePage(page)),
  onboardingPage: async ({ page }, use) => use(new OnboardingPage(page)),
});

export { expect };
