import { lastMessageAtToMs } from './conversationListUtils';

const DRAFTS_KEY = 'vdpconnect-message-drafts';
const CONVERSATIONS_KEY = 'vdpconnect-message-conversations';

/**
 * @typedef {Object} ConversationEntry
 * @property {string} userId
 * @property {string} [conversationId]
 * @property {string} [displayName]
 * @property {string} [avatarUrl]
 * @property {string} [handle]
 * @property {number} lastMessageAt
 * @property {string} [lastMessagePreview]
 */

/**
 * @returns {Record<string, string>} userId -> draft text
 */
export function getDrafts() {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} userId
 * @param {string} text
 */
export function setDraft(userId, text) {
  const drafts = getDrafts();
  if (text.trim()) {
    drafts[userId] = text;
  } else {
    delete drafts[userId];
  }
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch { /* localStorage may be unavailable */ }
}

/**
 * @param {string} userId
 */
export function clearDraft(userId) {
  const drafts = getDrafts();
  delete drafts[userId];
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch { /* localStorage may be unavailable */ }
}

/**
 * @returns {ConversationEntry[]}
 */
export function getConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * @param {ConversationEntry} entry
 */
export function upsertConversation(entry) {
  const list = getConversations();
  const idx = list.findIndex((c) => c.userId === entry.userId);
  const merged = { ...(idx >= 0 ? list[idx] : {}), ...entry };
  if (idx >= 0) {
    list[idx] = merged;
  } else {
    list.unshift(merged);
  }
  list.sort((a, b) => lastMessageAtToMs(b.lastMessageAt) - lastMessageAtToMs(a.lastMessageAt));
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(list));
  } catch { /* localStorage may be unavailable */ }
}

/**
 * Replace the persisted conversation list (e.g. after a successful API fetch).
 * @param {ConversationEntry[]} entries
 */
export function persistConversationList(entries) {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(entries));
  } catch { /* localStorage may be unavailable */ }
}

/**
 * @param {Object} conv — display row (API or merged UI shape)
 * @returns {ConversationEntry}
 */
export function conversationEntryFromDisplay(conv) {
  return {
    userId: conv.userId,
    conversationId: conv.conversationId ?? conv.id,
    displayName: conv.displayName,
    avatarUrl: conv.avatarUrl,
    handle: conv.handle,
    lastMessageAt: conv.lastMessageAt ?? Date.now(),
    lastMessagePreview: conv.lastMessagePreview,
  };
}
