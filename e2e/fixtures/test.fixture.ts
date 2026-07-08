import { expect } from '@playwright/test';
import { test as base } from './moderationSetup.fixture';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { CreatePostPage } from '../pages/CreatePostPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { LoginPage } from '../pages/LoginPage';
import { MessagingPage } from '../pages/MessagingPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { ReportedPostsPage } from '../pages/ReportedPostsPage';
import { UserProfilePage } from '../pages/UserProfilePage';

type PageObjectFixtures = {
  adminPanelPage: AdminPanelPage;
  createPostPage: CreatePostPage;
  editProfilePage: EditProfilePage;
  homeFeedPage: HomeFeedPage;
  loginPage: LoginPage;
  messagingPage: MessagingPage;
  onboardingPage: OnboardingPage;
  postDetailPage: PostDetailPage;
  registrationPage: RegistrationPage;
  reportedPostsPage: ReportedPostsPage;
  userProfilePage: UserProfilePage;
};

export const test = base.extend<PageObjectFixtures>({
  adminPanelPage: async ({ page }, use) => use(new AdminPanelPage(page)),
  createPostPage: async ({ page }, use) => use(new CreatePostPage(page)),
  editProfilePage: async ({ page }, use) => use(new EditProfilePage(page)),
  homeFeedPage: async ({ page }, use) => use(new HomeFeedPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  messagingPage: async ({ page }, use) => use(new MessagingPage(page)),
  onboardingPage: async ({ page }, use) => use(new OnboardingPage(page)),
  postDetailPage: async ({ page }, use) => use(new PostDetailPage(page)),
  registrationPage: async ({ page }, use) => use(new RegistrationPage(page)),
  reportedPostsPage: async ({ page }, use) => use(new ReportedPostsPage(page)),
  userProfilePage: async ({ page }, use) => use(new UserProfilePage(page)),
});

export { expect };
export { loginAs } from './auth.fixture';
