import { describe, expect, it } from 'vitest';
import {
  deriveConversationMetaFromMessages,
  patchConversationAtTop,
  previewFromMessageRow,
  sortConversationsByRecent,
} from './conversationListUtils';

describe('conversationListUtils', () => {
  it('builds preview from message content', () => {
    expect(previewFromMessageRow({ content: 'Hello world' })).toBe('Hello world');
    expect(previewFromMessageRow({ content: 'x'.repeat(60) })).toMatch(/…$/);
  });

  it('sorts conversations by lastMessageAt descending', () => {
    const sorted = sortConversationsByRecent([
      { userId: 'a', lastMessageAt: 100 },
      { userId: 'b', lastMessageAt: 300 },
      { userId: 'c', lastMessageAt: 200 },
    ]);
    expect(sorted.map((c) => c.userId)).toEqual(['b', 'c', 'a']);
  });

  it('sorts ISO string lastMessageAt values', () => {
    const sorted = sortConversationsByRecent([
      { userId: 'a', lastMessageAt: '2026-01-01T10:00:00Z' },
      { userId: 'b', lastMessageAt: '2026-01-03T10:00:00Z' },
      { userId: 'c', lastMessageAt: '2026-01-02T10:00:00Z' },
    ]);
    expect(sorted.map((c) => c.userId)).toEqual(['b', 'c', 'a']);
  });

  it('moves updated conversation to top', () => {
    const prev = [
      { userId: '1', conversationId: 'c1', lastMessageAt: 500 },
      { userId: '2', conversationId: 'c2', lastMessageAt: 400 },
    ];
    const next = patchConversationAtTop(prev, 'c2', { lastMessageAt: 900, lastMessagePreview: 'New' });
    expect(next[0].conversationId).toBe('c2');
    expect(next[0].lastMessagePreview).toBe('New');
  });

  it('derives preview from newest remaining message after delete', () => {
    const meta = deriveConversationMetaFromMessages([
      { id: '1', content: 'older', createdAt: '2026-01-01T10:00:00Z' },
      { id: '2', content: 'latest', createdAt: '2026-01-02T10:00:00Z' },
    ]);
    expect(meta.preview).toBe('latest');
    expect(meta.at).toBe(new Date('2026-01-02T10:00:00Z').getTime());
  });

  it('clears preview when no messages remain', () => {
    expect(deriveConversationMetaFromMessages([])).toEqual({ preview: '', at: 0 });
  });
});
