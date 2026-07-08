import { APIRequestContext } from '@playwright/test';

import { e2eConfig } from './env';

type CleanupTarget = {
  endpoint: string;
  id?: string;
};

async function deleteIfConfigured(request: APIRequestContext, target: CleanupTarget): Promise<void> {
  if (!e2eConfig.apiBaseURL || !e2eConfig.apiToken || !target.id) {
    return;
  }

  await request.delete(`${e2eConfig.apiBaseURL}${target.endpoint}/${target.id}`, {
    headers: {
      Authorization: `Bearer ${e2eConfig.apiToken}`,
    },
  });
}

export async function cleanupCreatedUser(request: APIRequestContext, userId?: string): Promise<void> {
  await deleteIfConfigured(request, { endpoint: '/api/users', id: userId });
}

export async function cleanupCreatedPost(request: APIRequestContext, postId?: string): Promise<void> {
  await deleteIfConfigured(request, { endpoint: '/api/posts', id: postId });
}

export async function cleanupCreatedComment(request: APIRequestContext, commentId?: string): Promise<void> {
  await deleteIfConfigured(request, { endpoint: '/api/comments', id: commentId });
}

export async function cleanupUploadedAsset(request: APIRequestContext, uploadId?: string): Promise<void> {
  await deleteIfConfigured(request, { endpoint: '/api/uploads', id: uploadId });
}

export async function cleanupModerationState(request: APIRequestContext, moderationId?: string): Promise<void> {
  await deleteIfConfigured(request, { endpoint: '/api/admin/moderation', id: moderationId });
}
