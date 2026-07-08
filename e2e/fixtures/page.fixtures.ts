import { LoginPage } from '../pages/LoginPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { CreatePostPage } from '../pages/CreatePostPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { OnboardingPage } from '../pages/OnboardingPage';

export type PageFixtures = {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  homeFeedPage: HomeFeedPage;
  createPostPage: CreatePostPage;
  userProfilePage: UserProfilePage;
  postDetailPage: PostDetailPage;
  adminPanelPage: AdminPanelPage;
  editProfilePage: EditProfilePage;
  onboardingPage: OnboardingPage;
};

export const pageFixtures = {
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
  homeFeedPage: async ({ page }, use) => {
    await use(new HomeFeedPage(page));
  },
  createPostPage: async ({ page }, use) => {
    await use(new CreatePostPage(page));
  },
  userProfilePage: async ({ page }, use) => {
    await use(new UserProfilePage(page));
  },
  postDetailPage: async ({ page }, use) => {
    await use(new PostDetailPage(page));
  },
  adminPanelPage: async ({ page }, use) => {
    await use(new AdminPanelPage(page));
  },
  editProfilePage: async ({ page }, use) => {
    await use(new EditProfilePage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
};
