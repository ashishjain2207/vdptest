import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as postService from '@/services/postService';

vi.mock('@/services/api/client.js', () => ({
  apiRequest: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  apiPut: vi.fn(),
}));
vi.mock('@/lib/config', () => ({ API_BASE: '' }));

describe('postService.searchPosts', () => {
  let apiGet;
  let apiRequest;

  beforeEach(async () => {
    vi.resetModules();
    const client = await import('@/services/api/client.js');
    apiGet = client.apiGet;
    apiRequest = client.apiRequest;
    vi.clearAllMocks();
  });

  it('returns empty result when keyword is empty string', async () => {
    const result = await postService.searchPosts('', 1, 20);
    expect(result).toEqual({ data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('returns empty result when keyword is whitespace only', async () => {
    const result = await postService.searchPosts('   ', 1, 20);
    expect(result).toEqual({ data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('returns empty result on 401 without calling API again', async () => {
    apiGet.mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await postService.searchPosts('test', 1, 20);
    expect(result).toEqual({ data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining('/api/Posts/search'),
      expect.any(Object),
    );
  });

  it('returns paginated data when API returns 200', async () => {
    const mockData = { data: [{ id: '1', content: 'Post with keyword' }], totalCount: 1, page: 1, pageSize: 20, totalPages: 1 };
    apiGet.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) });
    const result = await postService.searchPosts('keyword', 1, 20);
    expect(result).toEqual(mockData);
    expect(apiGet).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/Posts\/search\?q=keyword&page=1&pageSize=20/),
      expect.any(Object),
    );
  });

  it('throws when API returns non-401 error', async () => {
    apiGet.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', json: () => Promise.resolve({}) });
    await expect(postService.searchPosts('test', 1, 20)).rejects.toThrow();
  });

  it('preserves moderation status and code when create post returns 422', async () => {
    apiRequest.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: () => Promise.resolve({
        code: 'ContentRejected',
        message: 'This post cannot be published because it appears to violate platform rules.',
      }),
    });

    await expect(postService.createPost(new FormData())).rejects.toMatchObject({
      status: 422,
      code: 'ContentRejected',
      message: 'This post cannot be published because it appears to violate platform rules.',
    });
  });
});
