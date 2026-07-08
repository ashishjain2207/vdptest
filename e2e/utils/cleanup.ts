import { getE2EConfig } from './env';
import { deleteCommentById, deletePostById, type AuthenticatedSession } from './seed';

interface CleanupState {
  commentIds: string[];
  postIds: string[];
  createdUsers: string[];
  suspendedUserIds: string[];
  moderationCaseIds: string[];
}

const apiBaseUrl = getE2EConfig().apiBaseUrl;

export function createCleanupManager() {
  const state: CleanupState = {
    commentIds: [],
    postIds: [],
    createdUsers: [],
    suspendedUserIds: [],
    moderationCaseIds: [],
  };

  return {
    trackComment(commentId?: string | null) {
      if (commentId) {
        state.commentIds.push(commentId);
      }
    },
    trackPost(postId?: string | null) {
      if (postId) {
        state.postIds.push(postId);
      }
    },
    trackCreatedUser(identifier?: string | null) {
      if (identifier) {
        state.createdUsers.push(identifier);
      }
    },
    trackSuspendedUser(userId?: string | null) {
      if (userId) {
        state.suspendedUserIds.push(userId);
      }
    },
    trackModerationCase(caseId?: string | null) {
      if (caseId) {
        state.moderationCaseIds.push(caseId);
      }
    },
    async run(options: {
      normalUserSession?: AuthenticatedSession;
      adminSession?: AuthenticatedSession;
      deleteReason?: string;
    } = {}) {
      const { normalUserSession, adminSession, deleteReason = 'Playwright cleanup' } = options;

      if (normalUserSession) {
        for (const commentId of [...state.commentIds].reverse()) {
          await deleteCommentById(normalUserSession, commentId).catch(() => undefined);
        }

        for (const postId of [...state.postIds].reverse()) {
          await deletePostById(normalUserSession, postId, deleteReason).catch(() => undefined);
        }
      }

      if (adminSession) {
        for (const userId of [...state.suspendedUserIds].reverse()) {
          await adminSession.request
            .post(new URL(`/api/admin/users/${encodeURIComponent(userId)}/unsuspend`, `${apiBaseUrl}/`).toString())
            .catch(() => undefined);
        }

        for (const caseId of [...state.moderationCaseIds].reverse()) {
          await adminSession.request
            .patch(new URL(`/api/admin/content-moderation/${encodeURIComponent(caseId)}`, `${apiBaseUrl}/`).toString(), {
              data: { status: 'Dismissed' },
            })
            .catch(() => undefined);
        }
      }

      // The repository codebase does not expose a supported delete-user endpoint, so user cleanup is
      // tracked for reporting but intentionally handled as a no-op here.
      state.commentIds.length = 0;
      state.postIds.length = 0;
      state.createdUsers.length = 0;
      state.suspendedUserIds.length = 0;
      state.moderationCaseIds.length = 0;
    },
  };
}
