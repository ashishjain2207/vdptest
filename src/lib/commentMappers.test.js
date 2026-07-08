import { describe, it, expect } from 'vitest';
import { buildCommentTree, countCommentsInTree } from './commentMappers.js';

describe('buildCommentTree', () => {
  it('dedupes the same reply id when it appears nested and again as a top-level item', () => {
    const d1 = new Date('2024-01-02T12:00:00Z');
    const d2 = new Date('2024-01-03T12:00:00Z');
    const nestedReply = {
      id: 'reply-1',
      parentCommentId: 'root-1',
      createdAt: d2,
      isPinned: false,
      replies: [],
    };
    const list = [
      {
        id: 'root-1',
        parentCommentId: null,
        createdAt: d1,
        isPinned: false,
        replies: [nestedReply],
      },
      { ...nestedReply },
    ];
    const roots = buildCommentTree(list);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe('root-1');
    expect(roots[0].replies).toHaveLength(1);
    expect(roots[0].replies[0].id).toBe('reply-1');
  });

  it('still keeps multiple distinct replies from the same user (different ids)', () => {
    const d0 = new Date('2024-01-01T12:00:00Z');
    const d1 = new Date('2024-01-02T12:00:00Z');
    const d2 = new Date('2024-01-03T12:00:00Z');
    const list = [
      {
        id: 'root-1',
        parentCommentId: null,
        createdAt: d0,
        isPinned: false,
        replies: [
          {
            id: 'r-a',
            parentCommentId: 'root-1',
            authorId: 'user-9',
            createdAt: d1,
            isPinned: false,
            replies: [],
          },
          {
            id: 'r-b',
            parentCommentId: 'root-1',
            authorId: 'user-9',
            createdAt: d2,
            isPinned: false,
            replies: [],
          },
        ],
      },
    ];
    const roots = buildCommentTree(list);
    expect(roots[0].replies.map((r) => r.id).sort()).toEqual(['r-a', 'r-b']);
  });

  it('preserves nested replies even when parentCommentId is absent', () => {
    const d0 = new Date('2024-01-01T12:00:00Z');
    const d1 = new Date('2024-01-02T12:00:00Z');
    const list = [
      {
        id: 'root-1',
        parentCommentId: null,
        createdAt: d0,
        isPinned: false,
        replies: [
          {
            id: 'r-1',
            parentCommentId: null, // missing in payload
            createdAt: d1,
            isPinned: false,
            replies: [],
          },
        ],
      },
    ];
    const roots = buildCommentTree(list);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe('root-1');
    expect(roots[0].replies).toHaveLength(1);
    expect(roots[0].replies[0].id).toBe('r-1');
  });

  it('preserves three or more levels of nested replies from API-shaped payloads', () => {
    const d0 = new Date('2024-01-01T12:00:00Z');
    const d1 = new Date('2024-01-02T12:00:00Z');
    const d2 = new Date('2024-01-03T12:00:00Z');
    const d3 = new Date('2024-01-04T12:00:00Z');
    const list = [
      {
        id: 'root-1',
        parentCommentId: null,
        createdAt: d0,
        isPinned: false,
        replies: [
          {
            id: 'L1',
            parentCommentId: 'root-1',
            createdAt: d1,
            isPinned: false,
            replies: [
              {
                id: 'L2',
                parentCommentId: 'L1',
                createdAt: d2,
                isPinned: false,
                replies: [
                  {
                    id: 'L3',
                    parentCommentId: 'L2',
                    createdAt: d3,
                    isPinned: false,
                    replies: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const roots = buildCommentTree(list);
    expect(roots[0].replies[0].replies[0].replies[0].id).toBe('L3');
    expect(countCommentsInTree(roots)).toBe(4);
  });
});
