import { describe, expect, it } from 'vitest';
import { normalizePagedConnectionsResponse } from './connectionService';

describe('normalizePagedConnectionsResponse', () => {
  it('reads items from data, items, Items, or Data', () => {
    expect(normalizePagedConnectionsResponse({ items: [{ id: 'a' }] }).data).toEqual([{ id: 'a' }]);
    expect(normalizePagedConnectionsResponse({ Items: [{ id: 'b' }] }).data).toEqual([{ id: 'b' }]);
    expect(normalizePagedConnectionsResponse({ Data: [{ id: 'c' }] }).data).toEqual([{ id: 'c' }]);
    expect(normalizePagedConnectionsResponse({ data: [{ id: 'd' }] }).data).toEqual([{ id: 'd' }]);
  });

  it('reads pagination metadata from camelCase and PascalCase', () => {
    const normalized = normalizePagedConnectionsResponse({
      Items: [{ id: '1' }],
      Page: 2,
      PageSize: 50,
      TotalCount: 120,
      TotalPages: 3,
    }, 100);

    expect(normalized).toEqual({
      data: [{ id: '1' }],
      page: 2,
      pageSize: 50,
      totalCount: 120,
      totalPages: 3,
    });
  });

  it('derives totalPages from totalCount when omitted', () => {
    expect(normalizePagedConnectionsResponse({ data: [{ id: '1' }], totalCount: 150 }, 100).totalPages).toBe(2);
    expect(normalizePagedConnectionsResponse({ data: [], totalCount: 0 }, 100).totalPages).toBe(0);
  });
});
