import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendMessage, editMessage } from '@/services/messageService';
import { apiPost, apiPut } from '@/services/api/client.js';

vi.mock('@/services/api/client.js', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('@/lib/config', () => ({ API_BASE: '' }));

describe('messageService moderation errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves status, code, and message when sending returns 422', async () => {
    apiPost.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: () => Promise.resolve({
        code: 'ContentRejected',
        message: 'This message cannot be sent because it appears to violate platform rules.',
      }),
    });

    await expect(sendMessage('user-1', 'blocked text')).rejects.toMatchObject({
      status: 422,
      code: 'ContentRejected',
      message: 'This message cannot be sent because it appears to violate platform rules.',
    });
  });

  it('preserves status, code, and message when editing returns 422', async () => {
    apiPut.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: () => Promise.resolve({
        code: 'ContentReviewRequired',
        message: 'This message cannot be updated because it appears to violate platform rules.',
      }),
    });

    await expect(editMessage('message-1', 'blocked edit')).rejects.toMatchObject({
      status: 422,
      code: 'ContentReviewRequired',
      message: 'This message cannot be updated because it appears to violate platform rules.',
    });
  });
});
