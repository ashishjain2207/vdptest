import { expect, type Page } from '@playwright/test';
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
import { moderationSetupTest } from './moderationSetup.fixture';

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

function createPageFixture<T>(factory: (page: Page) => T) {
  return async ({ page }: { page: Page }, use: (fixture: T) => Promise<void>) => {
    await use(factory(page));
  };
}

export const test = moderationSetupTest.extend<PageObjectFixtures>({
  adminPanelPage: createPageFixture((page) => new AdminPanelPage(page)),
  createPostPage: createPageFixture((page) => new CreatePostPage(page)),
  editProfilePage: createPageFixture((page) => new EditProfilePage(page)),
  homeFeedPage: createPageFixture((page) => new HomeFeedPage(page)),
  loginPage: createPageFixture((page) => new LoginPage(page)),
  messagingPage: createPageFixture((page) => new MessagingPage(page)),
  onboardingPage: createPageFixture((page) => new OnboardingPage(page)),
  postDetailPage: createPageFixture((page) => new PostDetailPage(page)),
  registrationPage: createPageFixture((page) => new RegistrationPage(page)),
  reportedPostsPage: createPageFixture((page) => new ReportedPostsPage(page)),
  userProfilePage: createPageFixture((page) => new UserProfilePage(page)),
});

export { expect };
