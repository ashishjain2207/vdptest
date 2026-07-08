import { APIRequestContext } from '@playwright/test';

import { e2eConfig, requireSeedValue } from './env';

type SeededPost = {
  id?: string;
  text: string;
};

type SeededComment = {
  postId: string;
  commentId?: string;
  text: string;
};

type SeededUser = {
  id?: string;
  username: string;
};

async function postSeedRequest<T>(
  request: APIRequestContext,
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<T | undefined> {
  if (!e2eConfig.apiBaseURL || !e2eConfig.apiToken) {
    return undefined;
  }

  const response = await request.post(`${e2eConfig.apiBaseURL}${endpoint}`, {
    data: payload,
    headers: {
      Authorization: `Bearer ${e2eConfig.apiToken}`,
    },
  });

  if (!response.ok()) {
    throw new Error(`E2E seed request failed: ${endpoint} returned ${response.status()}`);
  }

  return response.json() as Promise<T>;
}

export function duplicateUsernameSeed(): string {
  return e2eConfig.seeded.duplicateUsername;
}

export async function ensureOwnPost(
  request: APIRequestContext,
  fallbackText: string,
): Promise<SeededPost> {
  const apiSeed = await postSeedRequest<SeededPost>(request, '/api/e2e/posts/own', { text: fallbackText });

  return {
    id: apiSeed?.id ?? e2eConfig.seeded.ownPostId,
    text: apiSeed?.text ?? e2eConfig.seeded.ownPostText ?? fallbackText,
  };
}

export async function ensureOtherUserPost(
  request: APIRequestContext,
  fallbackText: string,
): Promise<SeededPost> {
  const apiSeed = await postSeedRequest<SeededPost>(request, '/api/e2e/posts/other-user', {
    text: fallbackText,
  });

  return {
    id: apiSeed?.id ?? e2eConfig.seeded.otherPostId,
    text: apiSeed?.text ?? e2eConfig.seeded.otherPostText ?? fallbackText,
  };
}

export async function ensureReportedPost(
  request: APIRequestContext,
  fallbackText: string,
): Promise<SeededPost> {
  const apiSeed = await postSeedRequest<SeededPost>(request, '/api/e2e/posts/reported', {
    text: fallbackText,
  });

  return {
    id: apiSeed?.id ?? e2eConfig.seeded.reportedPostId,
    text: apiSeed?.text ?? e2eConfig.seeded.reportedPostText ?? fallbackText,
  };
}

export async function ensureCommentPost(
  request: APIRequestContext,
): Promise<string> {
  const apiSeed = await postSeedRequest<{ postId: string }>(request, '/api/e2e/comments/post', {});

  return requireSeedValue(
    apiSeed?.postId ?? e2eConfig.seeded.commentPostId,
    'E2E_COMMENT_POST_ID',
  );
}

export async function ensureOwnComment(
  request: APIRequestContext,
  fallbackText: string,
): Promise<SeededComment> {
  const apiSeed = await postSeedRequest<SeededComment>(request, '/api/e2e/comments/own', {
    text: fallbackText,
  });

  return {
    postId: requireSeedValue(
      apiSeed?.postId ?? e2eConfig.seeded.commentPostId,
      'E2E_COMMENT_POST_ID',
    ),
    commentId: apiSeed?.commentId ?? e2eConfig.seeded.ownCommentId,
    text: apiSeed?.text ?? e2eConfig.seeded.ownCommentText ?? fallbackText,
  };
}

export async function ensureOtherUserComment(
  request: APIRequestContext,
  fallbackText: string,
): Promise<SeededComment> {
  const apiSeed = await postSeedRequest<SeededComment>(request, '/api/e2e/comments/other-user', {
    text: fallbackText,
  });

  return {
    postId: requireSeedValue(
      apiSeed?.postId ?? e2eConfig.seeded.commentPostId,
      'E2E_COMMENT_POST_ID',
    ),
    commentId: apiSeed?.commentId ?? e2eConfig.seeded.otherCommentId,
    text: apiSeed?.text ?? e2eConfig.seeded.otherCommentText ?? fallbackText,
  };
}

export async function ensureTargetUser(request: APIRequestContext): Promise<SeededUser> {
  const apiSeed = await postSeedRequest<SeededUser>(request, '/api/e2e/users/target', {});

  return {
    id: apiSeed?.id ?? e2eConfig.seeded.targetUserId,
    username: requireSeedValue(
      apiSeed?.username ?? e2eConfig.seeded.targetUsername,
      'E2E_TARGET_USERNAME',
    ),
  };
}

export async function ensureModerationTargetUser(request: APIRequestContext): Promise<SeededUser> {
  const apiSeed = await postSeedRequest<SeededUser>(request, '/api/e2e/users/moderation-target', {});

  return {
    id: apiSeed?.id ?? e2eConfig.seeded.moderationUserId,
    username: requireSeedValue(
      apiSeed?.username ?? e2eConfig.seeded.moderationUsername,
      'E2E_MODERATION_USERNAME',
    ),
  };
}
