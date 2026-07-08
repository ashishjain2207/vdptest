import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUploadPolicy } from '@/services/uploadPolicyService';

describe('uploadPolicyService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('evicts rejected upload-policy requests from cache so later calls can retry', async () => {
    const responses = [
      // First call: transient failure
      {
        ok: false,
        statusText: 'Bad Gateway',
        json: async () => ({ message: 'Transient error' }),
      },
      // Second call: success
      {
        ok: true,
        json: async () => ({
          policyName: 'postAttachment',
          allowedMimes: ['image/png'],
          allowedExtensions: ['.png'],
          accept: 'image/png',
        }),
      },
    ];

    const fetchMock = vi.fn().mockImplementation(async () => responses.shift());
    vi.stubGlobal('fetch', fetchMock);

    await expect(getUploadPolicy('postAttachment')).rejects.toThrow(/Transient error/i);

    const dto = await getUploadPolicy('postAttachment');
    expect(dto.policyName).toBe('postAttachment');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

