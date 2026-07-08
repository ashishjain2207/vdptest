import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env';
import { resolveTemplateData } from './dataFactory';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataRoot = path.resolve(__dirname, '..', 'test-data');

export function loadJsonFixture<T>(relativePath: string): T {
  const absolutePath = path.join(testDataRoot, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function resolveFixtureTokens<T>(fixture: T, replacements: Record<string, string>): T {
  return resolveTemplateData(fixture, replacements);
}

export function requireSeedValue(name: string, value: string | undefined, helpText: string): string {
  if (!value) {
    throw new Error(`Missing seed value ${name}. ${helpText}`);
  }
  return value;
}

export function getDuplicateUsernameSeed(): string {
  return env.seeds.duplicateUsername ?? 'testuser';
}

export function getOtherUserSeed(): { profileKey: string; postText?: string } {
  return {
    profileKey: requireSeedValue(
      'E2E_OTHER_USER_PROFILE_KEY',
      env.seeds.otherUserProfileKey,
      'Set it to a public profile key or handle for another user visible to the normal user account.',
    ),
    postText: env.seeds.otherUserPostText,
  };
}

export function getCommentPermissionSeed(): { postId: string; commentText?: string } {
  return {
    postId: requireSeedValue(
      'E2E_COMMENT_TARGET_POST_ID',
      env.seeds.commentTargetPostId,
      'Set it to a visible post GUID that already contains another user comment.',
    ),
    commentText: env.seeds.otherUserCommentText,
  };
}

export function getFollowTargetSeed(): { profileKey: string; displayName?: string } {
  return {
    profileKey: requireSeedValue(
      'E2E_FOLLOW_TARGET_PROFILE_KEY',
      env.seeds.followTargetProfileKey,
      'Set it to a public profile key or handle for the account used in the follow/unfollow scenario.',
    ),
    displayName: env.seeds.followTargetDisplayName,
  };
}

export function getModerationCaseSeed(): { caseId?: string; casePreview?: string } {
  if (!env.seeds.reportedCaseId && !env.seeds.reportedCasePreview) {
    throw new Error(
      'Missing moderation seed. Set E2E_REPORTED_CASE_ID or E2E_REPORTED_CASE_PREVIEW for the admin moderation scenario.',
    );
  }

  return {
    caseId: env.seeds.reportedCaseId,
    casePreview: env.seeds.reportedCasePreview,
  };
}

export function getAdminTargetUserSeed(): { searchQuery: string; profileKey?: string } {
  return {
    searchQuery: requireSeedValue(
      'E2E_ADMIN_TARGET_USER_QUERY',
      env.seeds.adminTargetUserQuery,
      'Set it to a searchable user name, handle, or email fragment visible in /admin/users.',
    ),
    profileKey: env.seeds.adminTargetUserProfileKey,
  };
}

export function getOnboardingUserSeed(): { usernameOrEmail: string; password: string } {
  return {
    usernameOrEmail: requireSeedValue(
      'E2E_ONBOARDING_USER_USERNAME_OR_EMAIL',
      env.seeds.onboardingUserUsernameOrEmail ?? env.seeds.onboardingUserEmail,
      'Set onboarding user credentials for a user that still lands on /onboarding.',
    ),
    password: requireSeedValue(
      'E2E_ONBOARDING_USER_PASSWORD',
      env.seeds.onboardingUserPassword,
      'Set the onboarding user password for the onboarding scenarios.',
    ),
  };
}
