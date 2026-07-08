import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiPost = vi.fn();
const apiGet = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();
const prepareFilesForPostMultipart = vi.fn();

vi.mock('./api/client.js', () => ({
  apiPost,
  apiGet,
  apiPut,
  apiDelete,
}));

vi.mock('@/lib/config.js', () => ({
  API_BASE: '',
}));

vi.mock('./mediaService.js', () => ({
  prepareFilesForPostMultipart,
}));

describe('messageService', () => {
  beforeEach(() => {
    vi.resetModules();
    apiPost.mockReset();
    apiGet.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
    prepareFilesForPostMultipart.mockReset();
  });

  it('sendMessage (no files) throws Error with API message body on 400', async () => {
    apiPost.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'You must be connected to start a conversation.' }),
    });

    const { sendMessage } = await import('./messageService.js');

    await expect(sendMessage('other-user', 'hi')).rejects.toThrow(
      'You must be connected to start a conversation.',
    );
    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/Messages/send'),
      expect.objectContaining({ recipientUserId: 'other-user', content: 'hi' }),
      expect.any(Object),
    );
  });

  it('sendMessage (with files) throws Error with API message on send-with-attachments failure', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    prepareFilesForPostMultipart.mockResolvedValueOnce([file]);
    apiPost.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Attachment rejected.' }),
    });

    const { sendMessage } = await import('./messageService.js');

    await expect(sendMessage('peer', 'note', [file])).rejects.toThrow('Attachment rejected.');
    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/Messages/send-with-attachments'),
      expect.any(FormData),
      expect.any(Object),
    );
  });

  it('sendMessage falls back to statusText when JSON has no message', async () => {
    apiPost.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => ({}),
    });

    const { sendMessage } = await import('./messageService.js');

    await expect(sendMessage('u1', 'x')).rejects.toThrow('Bad Gateway');
  });

  it('getConversations throws Error with API message on failure', async () => {
    apiGet.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Session expired' }),
    });

    const { getConversations } = await import('./messageService.js');

    await expect(getConversations()).rejects.toThrow('Session expired');
  });

  it('getMessages throws Error with API message on failure', async () => {
    apiGet.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Not a participant' }),
    });

    const { getMessages } = await import('./messageService.js');

    await expect(getMessages('conv-guid')).rejects.toThrow('Not a participant');
  });

  it('markConversationAsRead throws Error with API message on non-404 failure', async () => {
    apiPost.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Cannot mark read' }),
    });

    const { markConversationAsRead } = await import('./messageService.js');

    await expect(markConversationAsRead('cid')).rejects.toThrow('Cannot mark read');
  });

  it('markConversationAsRead resolves on 404', async () => {
    apiPost.mockResolvedValueOnce({ ok: false, status: 404 });

    const { markConversationAsRead } = await import('./messageService.js');

    await expect(markConversationAsRead('missing')).resolves.toBeUndefined();
  });

  it('editMessage throws Error with API message on failure', async () => {
    apiPut.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Cannot edit' }),
    });

    const { editMessage } = await import('./messageService.js');

    await expect(editMessage('mid', 'new')).rejects.toThrow('Cannot edit');
  });

  it('deleteMessage throws Error with API message on failure', async () => {
    apiDelete.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Cannot delete' }),
    });

    const { deleteMessage } = await import('./messageService.js');

    await expect(deleteMessage('mid')).rejects.toThrow('Cannot delete');
  });

  it('addReaction throws Error with API message on failure', async () => {
    apiPost.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Bad emoji' }),
    });

    const { addReaction } = await import('./messageService.js');

    await expect(addReaction('mid', '👍')).rejects.toThrow('Bad emoji');
  });

  it('removeReaction throws Error with API message on failure', async () => {
    apiDelete.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'No reaction' }),
    });

    const { removeReaction } = await import('./messageService.js');

    await expect(removeReaction('mid')).rejects.toThrow('No reaction');
  });

  it('sendMessage resolves parsed body on success', async () => {
    apiPost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversationId: 'c1', messageId: 'm1' }),
    });

    const { sendMessage } = await import('./messageService.js');

    await expect(sendMessage('peer', 'hello')).resolves.toEqual({ conversationId: 'c1', messageId: 'm1' });
  });

  it('getMessagesUnreadCount returns 0 when response not ok', async () => {
    apiGet.mockResolvedValueOnce({ ok: false, status: 500 });

    const { getMessagesUnreadCount } = await import('./messageService.js');

    await expect(getMessagesUnreadCount()).resolves.toBe(0);
  });

  it('getMessagesUnreadCount returns numeric JSON when ok', async () => {
    apiGet.mockResolvedValueOnce({ ok: true, json: async () => 12 });

    const { getMessagesUnreadCount } = await import('./messageService.js');

    await expect(getMessagesUnreadCount()).resolves.toBe(12);
  });

  it('getLastSeen returns null lastSeenAt when request fails', async () => {
    apiGet.mockResolvedValueOnce({ ok: false, status: 404 });

    const { getLastSeen } = await import('./messageService.js');

    await expect(getLastSeen('user-1')).resolves.toEqual({ lastSeenAt: null });
  });

  it('getLastSeen maps lastSeenAt when ok', async () => {
    apiGet.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lastSeenAt: '2026-01-02T12:00:00Z' }),
    });

    const { getLastSeen } = await import('./messageService.js');

    await expect(getLastSeen('user-1')).resolves.toEqual({ lastSeenAt: '2026-01-02T12:00:00Z' });
  });
});
