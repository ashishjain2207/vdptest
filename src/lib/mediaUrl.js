/**
 * Heuristic: public media URL points to a video (by path extension).
 * @param {string | undefined} url
 */
export function isProbablyVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const path = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v|ogv)(\?|$)/.test(path);
}
