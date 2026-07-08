import { optionalEnv, requireEnv } from './env';
import { uniqueCommentText, uniquePostText } from './dataFactory';

type SeededTextData = {
  text?: string;
  content?: string;
  textTemplate?: string;
  contentTemplate?: string;
};

export function seededDuplicateUsername(fallback = 'testuser'): string {
  return optionalEnv('E2E_DUPLICATE_USERNAME') ?? fallback;
}

export function seededTargetProfileKey(fallback?: string): string {
  return (
    optionalEnv('E2E_TARGET_USER_PROFILE_SLUG') ??
    optionalEnv('E2E_TARGET_USER_ID') ??
    optionalEnv('E2E_TARGET_USER_USERNAME') ??
    fallback ??
    requireEnv('E2E_TARGET_USER_PROFILE_SLUG')
  );
}

export function ownProfileKey(fallback?: string): string {
  return (
    optionalEnv('E2E_NORMAL_USER_PROFILE_SLUG') ??
    optionalEnv('E2E_NORMAL_USER_ID') ??
    optionalEnv('E2E_NORMAL_USER_USERNAME') ??
    fallback ??
    requireEnv('E2E_NORMAL_USER_PROFILE_SLUG')
  );
}

export function seededPostId(envKey = 'E2E_EXISTING_POST_ID', fallback?: string): string {
  return optionalEnv(envKey) ?? fallback ?? requireEnv(envKey);
}

export function seededCommentText(envKey = 'E2E_EXISTING_COMMENT_TEXT', fallback = 'Existing comment'): string {
  return optionalEnv(envKey) ?? fallback;
}

export function seededAdminUserSearch(fallback?: string): string {
  return (
    optionalEnv('E2E_ADMIN_TARGET_USER_EMAIL') ??
    optionalEnv('E2E_ADMIN_TARGET_USER_USERNAME') ??
    fallback ??
    requireEnv('E2E_ADMIN_TARGET_USER_EMAIL')
  );
}

export function runtimePostText(data: SeededTextData): string {
  return uniquePostText(data.text ?? data.content ?? data.textTemplate ?? data.contentTemplate ?? 'Automated E2E post');
}

export function runtimeCommentText(data: SeededTextData): string {
  return uniqueCommentText(data.text ?? data.content ?? data.textTemplate ?? data.contentTemplate ?? 'Automated E2E comment');
}
