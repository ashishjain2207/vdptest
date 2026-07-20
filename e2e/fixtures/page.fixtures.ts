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

export interface PageObjectFixtures {
  adminPanelPage: AdminPanelPage;
  createPostPage: CreatePostPage;
  editProfilePage: EditProfilePage;
  homeFeedPage: HomeFeedPage;
  loginPage: LoginPage;
  onboardingPage: OnboardingPage;
  postDetailPage: PostDetailPage;
  registrationPage: RegistrationPage;
  userProfilePage: UserProfilePage;
}

export function createPageFixtures(page: Page): PageObjectFixtures {
  return {
    adminPanelPage: new AdminPanelPage(page),
    createPostPage: new CreatePostPage(page),
    editProfilePage: new EditProfilePage(page),
    homeFeedPage: new HomeFeedPage(page),
    loginPage: new LoginPage(page),
    onboardingPage: new OnboardingPage(page),
    postDetailPage: new PostDetailPage(page),
    registrationPage: new RegistrationPage(page),
    userProfilePage: new UserProfilePage(page),
  };
}
