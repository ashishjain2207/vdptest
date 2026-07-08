import { apiGet, apiPost, apiPut, apiDelete } from './api/client.js';
import { API_BASE } from '@/lib/config';
import { prepareFilesForPostMultipart } from './mediaService.js';

const getApiBase = () => (API_BASE || '');

async function throwMessageError(res, fallback) {
  const err = await res.json().catch(() => ({}));
  const error = new Error(err?.message || res.statusText || fallback);
  error.status = res.status;
  error.code = err?.code;
  throw error;
}

/**
 * Gets the current user's conversations from the Messages API.
 * @returns {Promise<Array<{ id: string, otherUserId: string, otherDisplayName: string, otherHandle?: string, otherAvatarUrl?: string, lastMessageAt?: string, lastMessagePreview?: string, unreadCount: number }>>}
 */
export async function getConversations() {
  const base = getApiBase();
  const res = await apiGet(`${base}/api/Messages/conversations`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to fetch conversations');
  }
  return res.json();
}

/**
 * Gets messages for a conversation.
 * @param {string} conversationId - Conversation ID
 * @param {number} [page=1] - Page number
 * @param {number} [pageSize=50] - Page size
 * @returns {Promise<Array<{ id: string, senderId: string, content: string, createdAt: string, isRead: boolean, isEdited?: boolean, editedAt?: string, isDeleted?: boolean }>>}
 */
export async function getMessages(conversationId, page = 1, pageSize = 50) {
  const base = getApiBase();
  const res = await apiGet(
    `${base}/api/Messages/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`,
    { showLoader: false },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to fetch messages');
  }
  return res.json();
}

/**
 * Marks a conversation as read. Call when the user opens/views the conversation.
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<void>}
 */
export async function markConversationAsRead(conversationId) {
  const base = getApiBase();
  const res = await apiPost(
    `${base}/api/Messages/conversations/${conversationId}/mark-read`,
    {},
    { showLoader: false },
  );
  // Conversation may have been removed server-side when empty; treat as already "read" / no-op
  if (res.status === 404) {
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to mark as read');
  }
}

/**
 * Gets the total unread message count across all conversations. Use for sidebar badge.
 * @returns {Promise<number>}
 */
export async function getMessagesUnreadCount() {
  const base = getApiBase();
  const res = await apiGet(`${base}/api/Messages/conversations/unread-count`, { showLoader: false });
  if (!res.ok) {
    return 0;
  }
  return res.json();
}

/**
 * Gets the last seen timestamp for a user. Returns null if online, never connected, or unknown.
 * @param {string} userId - User ID
 * @returns {Promise<{ lastSeenAt: string|null }>}
 */
export async function getLastSeen(userId) {
  const base = getApiBase();
  const res = await apiGet(`${base}/api/Users/${encodeURIComponent(userId)}/last-seen`, {
    showLoader: false,
  });
  if (!res.ok) {
    return { lastSeenAt: null };
  }
  const data = await res.json();
  return { lastSeenAt: data.lastSeenAt ?? null };
}

/**
 * Sends a direct message to a user.
 * @param {string} recipientUserId - Recipient user ID
 * @param {string} content - Message content
 * @param {File[]} [files] - Optional file attachments
 * @param {string} [replyToMessageId] - Optional message ID to reply to
 * @returns {Promise<{ conversationId: string, messageId: string }>}
 */
export async function sendMessage(recipientUserId, content, files = [], replyToMessageId = null) {
  const base = getApiBase();
  const hasFiles = Array.isArray(files) && files.length > 0;

  if (hasFiles) {
    const formData = new FormData();
    formData.append('recipientUserId', recipientUserId);
    formData.append('content', (content || '').trim());
    if (replyToMessageId) {formData.append('replyToMessageId', replyToMessageId);}
    const messageAttachmentMaxBytes = 10 * 1024 * 1024;
    const prepared = await prepareFilesForPostMultipart(files, { maxOutputBytes: messageAttachmentMaxBytes });
    for (const file of prepared) {
      formData.append('files', file);
    }
    const res = await apiPost(`${base}/api/Messages/send-with-attachments`, formData, { showLoader: false });
    if (!res.ok) {
      await throwMessageError(res, 'Failed to send message');
    }
    return res.json();
  }

  const body = { recipientUserId, content: (content || '').trim() };
  if (replyToMessageId) {body.replyToMessageId = replyToMessageId;}
  const res = await apiPost(`${base}/api/Messages/send`, body, { showLoader: false });
  if (!res.ok) {
    await throwMessageError(res, 'Failed to send message');
  }
  return res.json();
}

/**
 * Edits a message. Only the sender can edit their own message.
 * @param {string} messageId - Message ID (GUID)
 * @param {string} content - New message content
 * @returns {Promise<{ id: string, senderId: string, content: string, createdAt: string, isRead: boolean, isEdited: boolean, editedAt: string }>}
 */
export async function editMessage(messageId, content) {
  const base = getApiBase();
  const res = await apiPut(
    `${base}/api/Messages/${messageId}`,
    { content: content.trim() },
    { showLoader: false },
  );
  if (!res.ok) {
    await throwMessageError(res, 'Failed to edit message');
  }
  return res.json();
}

/**
 * Deletes a message (soft delete). Only the sender can delete their own message.
 * @param {string} messageId - Message ID (GUID)
 * @returns {Promise<void>}
 */
export async function deleteMessage(messageId) {
  const base = getApiBase();
  const res = await apiDelete(`${base}/api/Messages/${messageId}`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to delete message');
  }
}

/** Quick reactions shown first (5 professional emojis). */
export const QUICK_REACTION_EMOJIS = ['👍', '👎', '👏', '😢', '😊'];

/** Extended emojis for full picker (quick + more). */
export const EXTENDED_REACTION_EMOJIS = [
  '👍', '👎', '👏', '😢', '😊',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '😂', '🤣', '😄', '😁', '😆', '😅', '🙃', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '😝',
  '😮', '😲', '😱', '😨', '😰', '😥', '😭', '😿',
  '😠', '😡', '🤬', '😤', '😈', '👿',
  '😎', '🤓', '🧐', '😇', '🙂', '😌', '😏', '😒', '🙄', '😬', '🤥',
  '🔥', '⭐', '🌟', '✨', '💫', '💥', '💯', '✅', '❌', '❗', '❓',
  '👋', '🤚', '✋', '🖐', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '🙌', '👐', '🤲', '🙏',
  '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '💪', '🧠', '👀', '👂', '👃', '👅', '👄',
];

/** @deprecated Use QUICK_REACTION_EMOJIS */
export const REACTION_EMOJIS = QUICK_REACTION_EMOJIS;

/**
 * Adds or updates a reaction on a message.
 * @param {string} messageId - Message ID (GUID)
 * @param {string} emoji - Emoji (👍, 👎, 👏, 😢, 😊)
 * @returns {Promise<{ id: string, reactions: Array<{ emoji: string, count: number, isCurrentUser: boolean }> }>}
 */
export async function addReaction(messageId, emoji) {
  const base = getApiBase();
  // API accepts "emoji" (JsonPropertyName) or "Emoji"
  const res = await apiPost(
    `${base}/api/Messages/${messageId}/reactions`,
    { emoji },
    { showLoader: false },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to add reaction');
  }
  return res.json();
}

/**
 * Removes the current user's reaction from a message.
 * @param {string} messageId - Message ID (GUID)
 * @returns {Promise<{ id: string, reactions: Array<{ emoji: string, count: number, isCurrentUser: boolean }> }>}
 */
export async function removeReaction(messageId) {
  const base = getApiBase();
  const res = await apiDelete(`${base}/api/Messages/${messageId}/reactions`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to remove reaction');
  }
  return res.json();
}

/**
 * Fetches a media file as blob (via API proxy to bypass CORS). Use for copy-to-clipboard.
 * @param {string} mediaFileId - Media file ID (GUID)
 * @returns {Promise<Blob>}
 */
export async function getMediaFileBlob(mediaFileId) {
  const base = getApiBase();
  const res = await apiGet(`${base}/api/Media/${mediaFileId}/file`, { showLoader: false });
  if (!res.ok) {throw new Error('Failed to fetch media file');}
  return res.blob();
}
