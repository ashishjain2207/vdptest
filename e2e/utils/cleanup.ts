import type { APIRequestContext } from '@playwright/test';
import { getE2EConfig, optionalEnv } from './env';

async function bestEffortDelete(request: APIRequestContext, url: string): Promise<void> {
  try {
    await request.delete(url, {
      headers: apiHeaders(),
      failOnStatusCode: false,
    });
  } catch {
    // Cleanup is best-effort so the primary assertion failure remains visible.
  }
}

function apiHeaders(): Record<string, string> {
  const token = optionalEnv('E2E_API_TOKEN');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiURL(pathname: string): string | undefined {
  const { apiBaseURL } = getE2EConfig();
  if (!apiBaseURL) {
    return undefined;
  }
  return new URL(pathname, apiBaseURL).toString();
}

export async function cleanupPost(request: APIRequestContext, postId?: string): Promise<void> {
  if (!postId) {
    return;
  }
  const url = apiURL(`/api/Posts/${encodeURIComponent(postId)}`);
  if (url) {
    await bestEffortDelete(request, url);
  }
}

export async function cleanupComment(request: APIRequestContext, commentId?: string): Promise<void> {
  if (!commentId) {
    return;
  }
  const url = apiURL(`/api/Comments/${encodeURIComponent(commentId)}`);
  if (url) {
    await bestEffortDelete(request, url);
  }
}

export async function cleanupUser(request: APIRequestContext, userId?: string): Promise<void> {
  if (!userId) {
    return;
  }
  const url = apiURL(`/api/Users/${encodeURIComponent(userId)}`);
  if (url) {
    await bestEffortDelete(request, url);
  }
}

export async function cleanupUpload(request: APIRequestContext, uploadId?: string): Promise<void> {
  if (!uploadId) {
    return;
  }
  const url = apiURL(`/api/Uploads/${encodeURIComponent(uploadId)}`);
  if (url) {
    await bestEffortDelete(request, url);
  }
}

export async function cleanupModerationState(request: APIRequestContext, caseId?: string): Promise<void> {
  if (!caseId) {
    return;
  }
  const url = apiURL(`/api/Admin/content-moderation/cases/${encodeURIComponent(caseId)}/reset`);
  if (url) {
    try {
      await request.post(url, {
        headers: apiHeaders(),
        failOnStatusCode: false,
      });
    } catch {
      // Best-effort cleanup only.
    }
  }
}
