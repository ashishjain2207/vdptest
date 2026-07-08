import { type Page } from '@playwright/test';
import { moderationSetupTest } from './moderationSetup.fixture';
import { RegistrationPage } from '../pages/RegistrationPage';
import { LoginPage } from '../pages/LoginPage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { CreatePostPage } from '../pages/CreatePostPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { ReportedPostsPage } from '../pages/ReportedPostsPage';
import { MessagingPage } from '../pages/MessagingPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { OnboardingPage } from '../pages/OnboardingPage';

export type PageObjectFixtures = {
  registrationPage: RegistrationPage;
  loginPage: LoginPage;
  homeFeedPage: HomeFeedPage;
  createPostPage: CreatePostPage;
  userProfilePage: UserProfilePage;
  postDetailPage: PostDetailPage;
  adminPanelPage: AdminPanelPage;
  reportedPostsPage: ReportedPostsPage;
  messagingPage: MessagingPage;
  editProfilePage: EditProfilePage;
  onboardingPage: OnboardingPage;
};

function createPageObject<T>(page: Page, Factory: new (page: Page) => T): T {
  return new Factory(page);
}

export const test = moderationSetupTest.extend<PageObjectFixtures>({
  registrationPage: async ({ page }, use) => {
    await use(createPageObject(page, RegistrationPage));
  },
  loginPage: async ({ page }, use) => {
    await use(createPageObject(page, LoginPage));
  },
  homeFeedPage: async ({ page }, use) => {
    await use(createPageObject(page, HomeFeedPage));
  },
  createPostPage: async ({ page }, use) => {
    await use(createPageObject(page, CreatePostPage));
  },
  userProfilePage: async ({ page }, use) => {
    await use(createPageObject(page, UserProfilePage));
  },
  postDetailPage: async ({ page }, use) => {
    await use(createPageObject(page, PostDetailPage));
  },
  adminPanelPage: async ({ page }, use) => {
    await use(createPageObject(page, AdminPanelPage));
  },
  reportedPostsPage: async ({ page }, use) => {
    await use(createPageObject(page, ReportedPostsPage));
  },
  messagingPage: async ({ page }, use) => {
    await use(createPageObject(page, MessagingPage));
  },
  editProfilePage: async ({ page }, use) => {
    await use(createPageObject(page, EditProfilePage));
  },
  onboardingPage: async ({ page }, use) => {
    await use(createPageObject(page, OnboardingPage));
  },
});

export { expect } from '@playwright/test';
