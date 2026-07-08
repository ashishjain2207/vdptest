/**
 * @param {string} name
 * @returns {string}
 */
export function fileExt(name) {
  const s = String(name || '').trim();
  const i = s.lastIndexOf('.');
  if (i < 0) {
    return '';
  }
  return s.slice(i).toLowerCase();
}

/**
 * Best-effort client-side check. Server remains authoritative.
 * @param {File} file
 * @param {{ allowedMimes?: string[], allowedExtensions?: string[] } | null | undefined} policy
 * @returns {boolean}
 */
export function isFileAllowedByUploadPolicy(file, policy) {
  if (!file || !policy) {
    return false;
  }
  const exts = Array.isArray(policy.allowedExtensions) ? policy.allowedExtensions.map((e) => String(e || '').toLowerCase()) : [];
  const mimes = Array.isArray(policy.allowedMimes) ? policy.allowedMimes.map((m) => String(m || '').toLowerCase()) : [];

  const ext = fileExt(file.name);
  const t = String(file.type || '').toLowerCase();
  if (t && mimes.length > 0 && !mimes.includes(t)) {
    return false;
  }

  // If extension is missing, allow MIME-only match (common for camera-captured / renamed files).
  if (!ext) {
    return mimes.length === 0 ? false : Boolean(t);
  }

  if (exts.length > 0 && !exts.includes(ext)) {
    return false;
  }

  return true;
}

