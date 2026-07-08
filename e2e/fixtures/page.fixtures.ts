import type { Page } from '@playwright/test';
import { AdminPanelPage } from '../pages/AdminPanelPage';
import { CreatePostPage } from '../pages/CreatePostPage';
import { EditProfilePage } from '../pages/EditProfilePage';
import { HomeFeedPage } from '../pages/HomeFeedPage';
import { LoginPage } from '../pages/LoginPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { UserProfilePage } from '../pages/UserProfilePage';

export type PageObjectFixtures = {
  adminPanelPage: AdminPanelPage;
  createPostPage: CreatePostPage;
  editProfilePage: EditProfilePage;
  homeFeedPage: HomeFeedPage;
  loginPage: LoginPage;
  onboardingPage: OnboardingPage;
  postDetailPage: PostDetailPage;
  registrationPage: RegistrationPage;
  userProfilePage: UserProfilePage;
};

export function pageObjectFixtures() {
  return {
    adminPanelPage: async ({ page }: { page: Page }, use: (fixture: AdminPanelPage) => Promise<void>) => {
      await use(new AdminPanelPage(page));
    },
    createPostPage: async ({ page }: { page: Page }, use: (fixture: CreatePostPage) => Promise<void>) => {
      await use(new CreatePostPage(page));
    },
    editProfilePage: async ({ page }: { page: Page }, use: (fixture: EditProfilePage) => Promise<void>) => {
      await use(new EditProfilePage(page));
    },
    homeFeedPage: async ({ page }: { page: Page }, use: (fixture: HomeFeedPage) => Promise<void>) => {
      await use(new HomeFeedPage(page));
    },
    loginPage: async ({ page }: { page: Page }, use: (fixture: LoginPage) => Promise<void>) => {
      await use(new LoginPage(page));
    },
    onboardingPage: async ({ page }: { page: Page }, use: (fixture: OnboardingPage) => Promise<void>) => {
      await use(new OnboardingPage(page));
    },
    postDetailPage: async ({ page }: { page: Page }, use: (fixture: PostDetailPage) => Promise<void>) => {
      await use(new PostDetailPage(page));
    },
    registrationPage: async ({ page }: { page: Page }, use: (fixture: RegistrationPage) => Promise<void>) => {
      await use(new RegistrationPage(page));
    },
    userProfilePage: async ({ page }: { page: Page }, use: (fixture: UserProfilePage) => Promise<void>) => {
      await use(new UserProfilePage(page));
    },
  };
}
