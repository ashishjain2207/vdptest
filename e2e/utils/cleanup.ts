import type { TestInfo } from '@playwright/test';
import type { PostDetailPage } from '../pages/PostDetailPage';
import type { UserProfilePage } from '../pages/UserProfilePage';

export async function bestEffortCleanup(label: string, action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.warn(`[cleanup] ${label} failed`, error);
  }
}

export async function cleanupCreatedPost(
  profilePage: UserProfilePage,
  postDetailPage: PostDetailPage,
  postText: string,
): Promise<void> {
  await bestEffortCleanup(`delete post: ${postText}`, async () => {
    await profilePage.openPostByContent(postText);
    await postDetailPage.openPostActions();
    await postDetailPage.deletePostFromMenu();
    await postDetailPage.confirmDeletion();
  });
}

export async function cleanupCreatedComment(
  postDetailPage: PostDetailPage,
  commentText: string,
): Promise<void> {
  await bestEffortCleanup(`delete comment: ${commentText}`, async () => {
    await postDetailPage.deleteCommentByText(commentText);
  });
}

export async function cleanupModerationState(label: string, action: () => Promise<void>): Promise<void> {
  await bestEffortCleanup(`moderation reset: ${label}`, action);
}

export function attachCleanupNotes(testInfo: TestInfo, notes: string[]): void {
  if (notes.length === 0) {
    return;
  }

  testInfo.annotations.push({
    type: 'cleanup',
    description: notes.join(' | '),
  });
}
