import type { Page } from '@playwright/test';
import { authTest } from './auth.fixtures';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { CreatePostPage } from '../pages/CreatePostPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { LoginPage } from '../pages/LoginPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { UserProfilePage } from '../pages/UserProfilePage';

type PageFixtures = {
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

function withPage<T>(page: Page, Factory: new (page: Page) => T): T {
  return new Factory(page);
}

export const pageTest = authTest.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(withPage(page, LoginPage)),
  registrationPage: async ({ page }, use) => use(withPage(page, RegistrationPage)),
  homeFeedPage: async ({ page }, use) => use(withPage(page, HomeFeedPage)),
  createPostPage: async ({ page }, use) => use(withPage(page, CreatePostPage)),
  userProfilePage: async ({ page }, use) => use(withPage(page, UserProfilePage)),
  postDetailPage: async ({ page }, use) => use(withPage(page, PostDetailPage)),
  adminPanelPage: async ({ page }, use) => use(withPage(page, AdminPanelPage)),
  editProfilePage: async ({ page }, use) => use(withPage(page, EditProfilePage)),
  onboardingPage: async ({ page }, use) => use(withPage(page, OnboardingPage)),
});
