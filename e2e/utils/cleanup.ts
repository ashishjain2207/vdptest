import type { APIRequestContext } from '@playwright/test';

import type { AuthRole } from './env';
import { deleteCommentViaApi, deletePostViaApi, unfollowUserViaApi } from './seed';

type CleanupAction =
  | { type: 'post'; role: AuthRole; postId: string }
  | { type: 'comment'; role: AuthRole; commentId: string }
  | { type: 'follow'; role: AuthRole; targetUserId: string };

export class CleanupRegistry {
  private actions: CleanupAction[] = [];

  trackPost(role: AuthRole, postId: string): void {
    if (postId) {
      this.actions.push({ type: 'post', role, postId });
    }
  }

  trackComment(role: AuthRole, commentId: string): void {
    if (commentId) {
      this.actions.push({ type: 'comment', role, commentId });
    }
  }

  trackFollow(role: AuthRole, targetUserId: string): void {
    if (targetUserId) {
      this.actions.push({ type: 'follow', role, targetUserId });
    }
  }

  async run(request: APIRequestContext): Promise<void> {
    while (this.actions.length > 0) {
      const action = this.actions.pop();
      if (!action) {
        continue;
      }

      try {
        if (action.type === 'post') {
          await deletePostViaApi(request, action.role, action.postId);
          continue;
        }

        if (action.type === 'comment') {
          await deleteCommentViaApi(request, action.role, action.commentId);
          continue;
        }

        await unfollowUserViaApi(request, action.role, action.targetUserId);
      } catch {
        // Best-effort cleanup only; individual tests assert behavior explicitly.
      }
    }
  }
}
