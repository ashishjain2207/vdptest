/** Preview line for conversation list from a message row. */
export function previewFromMessageRow(message) {
  if (!message) {
    return '';
  }
  const c = message.content ?? message.Content ?? '';
  const trimmed = String(c).trim();
  if (trimmed) {
    return trimmed.length > 50 ? `${trimmed.slice(0, 50)}…` : trimmed;
  }
  const atts = message.attachments ?? message.Attachments;
  if (Array.isArray(atts) && atts.length > 0) {
    return '📎 Attachment';
  }
  return '';
}

/** @param {unknown} value */
export function lastMessageAtToMs(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** @param {Array<Record<string, unknown>>} list */
export function sortConversationsByRecent(list) {
  return [...list].sort(
    (a, b) => lastMessageAtToMs(b.lastMessageAt) - lastMessageAtToMs(a.lastMessageAt),
  );
}

/** @param {Record<string, unknown>} c @param {string} convIdStr @param {string} [userId] */
export function conversationMatches(c, convIdStr, userId) {
  if (convIdStr && (String(c.conversationId) === convIdStr || String(c.id) === convIdStr)) {
    return true;
  }
  if (userId && String(c.userId) === String(userId)) {
    return true;
  }
  return false;
}

/**
 * Update a conversation row and move it to the top (most recent first).
 * @param {Array<Record<string, unknown>>} prev
 * @param {string} convIdStr
 * @param {Record<string, unknown>} patch
 * @param {string} [userId]
 */
export function patchConversationAtTop(prev, convIdStr, patch, userId) {
  const idx = prev.findIndex((c) => conversationMatches(c, convIdStr, userId));
  if (idx < 0) {
    return sortConversationsByRecent([patch, ...prev]);
  }
  const updated = { ...prev[idx], ...patch };
  const next = [...prev];
  next.splice(idx, 1);
  return sortConversationsByRecent([updated, ...next]);
}

/**
 * Derive list preview + timestamp from remaining messages (newest first in state).
 * @param {Array<Record<string, unknown>>} messages
 */
export function deriveConversationMetaFromMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { preview: '', at: 0 };
  }
  const sorted = [...messages].sort(
    (a, b) => new Date(b.createdAt ?? b.CreatedAt).getTime() - new Date(a.createdAt ?? a.CreatedAt).getTime(),
  );
  const latest = sorted[0];
  const createdAt = latest.createdAt ?? latest.CreatedAt;
  const at = createdAt ? new Date(createdAt).getTime() : Date.now();
  return { preview: previewFromMessageRow(latest), at };
}
