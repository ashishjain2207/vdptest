/**
 * Builds an unsigned JWT-shaped string for unit tests (payload only is parsed by authService).
 * @param {Record<string, unknown>} payload
 * @returns {string}
 */
export function mockJwt(payload) {
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
}
