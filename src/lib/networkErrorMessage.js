/**
 * Map browser `fetch` failures (often "Failed to fetch") to a clear user message.
 * Large multipart bodies, proxy limits, or connection resets often produce no JSON body to parse.
 * @param {unknown} err
 * @param {{ upload?: boolean }} [options]
 * @returns {Error}
 */
export function toUserFacingRequestError(err, options = {}) {
  const upload = options.upload !== false;
  if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
    return err instanceof Error ? err : new Error(String(err));
  }
  const m = String((err && typeof err === 'object' && 'message' in err && err.message) || err || '');
  const lower = m.toLowerCase();
  if (
    lower.includes('failed to fetch')
    || lower.includes('networkerror when attempting to fetch')
    || m === 'Load failed'
  ) {
    return new Error(
      upload
        ? 'The image may exceed the maximum upload size, or the connection was interrupted. Try a smaller file or check your network.'
        : 'Request failed. Check your network connection and try again.',
    );
  }
  return err instanceof Error ? err : new Error(m || 'Request failed');
}
