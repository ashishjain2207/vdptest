import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

let envLoaded = false;

function loadEnvFiles(): void {
  if (envLoaded) {
    return;
  }

  for (const candidate of [
    path.join(repoRoot, '.env'),
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, '.env.e2e'),
    path.join(repoRoot, '.env.e2e.local'),
    path.join(repoRoot, 'e2e', '.env.e2e'),
    path.join(repoRoot, 'e2e', '.env.e2e.local'),
  ]) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false });
    }
  }

  envLoaded = true;
}

function required(name: string): string {
  loadEnvFiles();
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  loadEnvFiles();
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export interface RoleCredentials {
  email: string;
  password: string;
  usernameOrEmail: string;
  username?: string;
  profileKey?: string;
}

export interface ScenarioSeedConfig {
  duplicateUsername?: string;
  otherUserProfileKey?: string;
  otherUserPostText?: string;
  otherUserCommentText?: string;
  commentTargetPostId?: string;
  followTargetProfileKey?: string;
  followTargetDisplayName?: string;
  reportedCaseId?: string;
  reportedCasePreview?: string;
  adminTargetUserQuery?: string;
  adminTargetUserProfileKey?: string;
  onboardingUserEmail?: string;
  onboardingUserPassword?: string;
  onboardingUserUsernameOrEmail?: string;
}

export interface E2EEnvironment {
  baseUrl: string;
  normalUser: RoleCredentials;
  adminUser: RoleCredentials;
  seeds: ScenarioSeedConfig;
}

function buildRole(prefix: 'E2E_NORMAL_USER' | 'E2E_ADMIN_USER'): RoleCredentials {
  const email = required(`${prefix}_EMAIL`);
  const username = optional(`${prefix}_USERNAME`);
  return {
    email,
    password: required(`${prefix}_PASSWORD`),
    username,
    usernameOrEmail: optional(`${prefix}_USERNAME_OR_EMAIL`) ?? username ?? email,
    profileKey: optional(`${prefix}_PROFILE_KEY`) ?? username,
  };
}

export function getE2EEnvironment(): E2EEnvironment {
  return {
    baseUrl: required('E2E_BASE_URL'),
    normalUser: buildRole('E2E_NORMAL_USER'),
    adminUser: buildRole('E2E_ADMIN_USER'),
    seeds: {
      duplicateUsername: optional('E2E_DUPLICATE_USERNAME'),
      otherUserProfileKey: optional('E2E_OTHER_USER_PROFILE_KEY'),
      otherUserPostText: optional('E2E_OTHER_USER_POST_TEXT'),
      otherUserCommentText: optional('E2E_OTHER_USER_COMMENT_TEXT'),
      commentTargetPostId: optional('E2E_COMMENT_TARGET_POST_ID'),
      followTargetProfileKey: optional('E2E_FOLLOW_TARGET_PROFILE_KEY'),
      followTargetDisplayName: optional('E2E_FOLLOW_TARGET_DISPLAY_NAME'),
      reportedCaseId: optional('E2E_REPORTED_CASE_ID'),
      reportedCasePreview: optional('E2E_REPORTED_CASE_PREVIEW'),
      adminTargetUserQuery: optional('E2E_ADMIN_TARGET_USER_QUERY'),
      adminTargetUserProfileKey: optional('E2E_ADMIN_TARGET_USER_PROFILE_KEY'),
      onboardingUserEmail: optional('E2E_ONBOARDING_USER_EMAIL'),
      onboardingUserPassword: optional('E2E_ONBOARDING_USER_PASSWORD'),
      onboardingUserUsernameOrEmail: optional('E2E_ONBOARDING_USER_USERNAME_OR_EMAIL'),
    },
  };
}

export const env = getE2EEnvironment();
