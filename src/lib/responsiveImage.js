/**
 * Build `srcSet` / `sizes` for `<img>` from API width-keyed URLs (e.g. "640" → https://…).
 * @param {string} src Primary URL (typically largest / master WebP).
 * @param {Record<string, string> | null | undefined} widthToUrl
 * @param {string} [sizes]
 * @returns {{ src: string, srcSet?: string, sizes?: string }}
 */
export function buildSrcSetFromVariantMap(src, widthToUrl, sizes) {
  const primary = String(src || '').trim();
  if (!primary) {
    return { src: '' };
  }
  const entries =
    widthToUrl && typeof widthToUrl === 'object'
      ? Object.entries(widthToUrl)
        .map(([w, u]) => ({ w: parseInt(w, 10), u: String(u || '').trim() }))
        .filter((x) => Number.isFinite(x.w) && x.w > 0 && x.u)
      : [];
  entries.sort((a, b) => a.w - b.w);
  if (!entries.length) {
    return { src: primary };
  }
  const srcSet = entries.map((x) => `${x.u} ${x.w}w`).join(', ');
  return {
    src: primary,
    srcSet,
    sizes: sizes ?? '(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 1200px',
  };
}
