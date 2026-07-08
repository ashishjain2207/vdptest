/**
 * Validates GUID strings returned by the API (.NET uniqueidentifier serialized as dashed JSON,
 * or legacy 32-char hex). Prefer this over RFC-only regexes: UUID version digit can be 6/7+, etc.
 * @param {unknown} value
 */
export function isGuidString(value) {
  let s = String(value ?? '').trim();
  if (s.startsWith('{') && s.endsWith('}')) {
    s = s.slice(1, -1).trim();
  }
  if (/^[0-9a-f]{32}$/i.test(s)) {
    return true;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
