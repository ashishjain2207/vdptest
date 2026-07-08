import { test as base, expect } from '@playwright/test';
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
import { authFixtures, type AuthFixtures } from './auth.fixture';
import { moderationSetupFixtures, type ModerationSetupFixtures } from './moderationSetup.fixture';
import { postSetupFixtures, type PostSetupFixtures } from './postSetup.fixture';
import { userSetupFixtures, type UserSetupFixtures } from './userSetup.fixture';

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

export const test = base.extend<
  AuthFixtures &
  UserSetupFixtures &
  PostSetupFixtures &
  ModerationSetupFixtures &
  PageObjectFixtures
>({
  ...authFixtures,
  ...userSetupFixtures,
  ...postSetupFixtures,
  ...moderationSetupFixtures,
  adminPanelPage: async ({ page }, use) => {
    await use(new AdminPanelPage(page));
  },
  createPostPage: async ({ page }, use) => {
    await use(new CreatePostPage(page));
  },
  editProfilePage: async ({ page }, use) => {
    await use(new EditProfilePage(page));
  },
  homeFeedPage: async ({ page }, use) => {
    await use(new HomeFeedPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  messagingPage: async ({ page }, use) => {
    await use(new MessagingPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
  postDetailPage: async ({ page }, use) => {
    await use(new PostDetailPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
  reportedPostsPage: async ({ page }, use) => {
    await use(new ReportedPostsPage(page));
  },
  userProfilePage: async ({ page }, use) => {
    await use(new UserProfilePage(page));
  },
});

export { expect };
