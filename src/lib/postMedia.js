/** @typedef {'image' | 'video' | 'audio' | 'document'} PostMediaKind */

import {
  DEFAULT_MAX_OUTPUT_BYTES as POST_MEDIA_MAX_OUTPUT_BYTES,
  DEFAULT_MAX_INPUT_IMAGE_BYTES as POST_MEDIA_MAX_INPUT_IMAGE_BYTES,
  DEFAULT_MAX_INPUT_VIDEO_BYTES as POST_MEDIA_MAX_INPUT_VIDEO_BYTES,
} from './mediaOptimize.js';
import { normalizeImageDisplayFromApi } from './imageCropMetadata.js';

export { POST_MEDIA_MAX_OUTPUT_BYTES, POST_MEDIA_MAX_INPUT_IMAGE_BYTES, POST_MEDIA_MAX_INPUT_VIDEO_BYTES };

/** Legacy: max raw attachment size for UI checks (max of image/video input caps). */
export const POST_MEDIA_MAX_FILE_BYTES = Math.max(
  POST_MEDIA_MAX_INPUT_VIDEO_BYTES,
  POST_MEDIA_MAX_INPUT_IMAGE_BYTES,
);

/** @deprecated Use POST_MEDIA_MAX_FILE_BYTES */
export const POST_MEDIA_MAX_IMAGE_BYTES = POST_MEDIA_MAX_FILE_BYTES;
/** @deprecated Use POST_MEDIA_MAX_FILE_BYTES */
export const POST_MEDIA_MAX_VIDEO_BYTES = POST_MEDIA_MAX_FILE_BYTES;
/** @deprecated Use POST_MEDIA_MAX_FILE_BYTES */
export const POST_MEDIA_MAX_AUDIO_BYTES = POST_MEDIA_MAX_FILE_BYTES;

/** Allow any file type in the OS picker (matches server: images, video, audio, documents, archives, etc.). */
export const POST_MEDIA_ACCEPT = '*/*';

/**
 * Human-readable size (e.g. "12.5 MB") for toasts.
 * @param {number} bytes
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * API returns mediaType like "Image", "Video", "Audio", "Document", "File".
 * @param {string | undefined | null} mediaType
 * @returns {PostMediaKind}
 */
export function postMediaKindFromApiType(mediaType) {
  const s = String(mediaType ?? '').toLowerCase();
  if (s === 'video' || s.startsWith('video')) {
    return 'video';
  }
  if (s === 'audio' || s.startsWith('audio')) {
    return 'audio';
  }
  if (s === 'image' || s.startsWith('image')) {
    return 'image';
  }
  if (s === 'document' || s === 'file' || s === 'unknown') {
    return 'document';
  }
  return 'document';
}

/**
 * Guess kind from URL when mediaType is missing (legacy).
 * @param {string} url
 * @returns {PostMediaKind}
 */
export function postMediaKindFromUrl(url) {
  const u = String(url || '').split(/[?#]/)[0].toLowerCase();
  if (!u) {
    return 'document';
  }
  if (u.startsWith('blob:')) {
    return 'image';
  }
  if (/\.(mp4|webm|mov|m4v|ogv|mkv)$/.test(u)) {
    return 'video';
  }
  if (/\.(mp3|wav|m4a|ogg|aac|flac|opus)$/.test(u)) {
    return 'audio';
  }
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(u)) {
    return 'image';
  }
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z|tar|gz)$/.test(u)) {
    return 'document';
  }
  const lastPathPart = u.split('/').pop() || '';
  if (!lastPathPart.includes('.')) {
    return 'image';
  }
  // Legacy media URLs can be extensionless or use unhelpful extensions; if it looks like
  // a media/blob route, prefer rendering it as an image rather than a file attachment.
  if (u.includes('/media/') || u.includes('/image') || u.includes('/images/') || u.includes('/blob')) {
    return 'image';
  }
  return 'document';
}

/**
 * @param {File} file
 * @returns {PostMediaKind}
 */
export function postMediaKindFromFile(file) {
  const t = file?.type ?? '';
  if (t.startsWith('image/')) {
    return 'image';
  }
  if (t.startsWith('video/')) {
    return 'video';
  }
  if (t.startsWith('audio/')) {
    return 'audio';
  }
  return 'document';
}

/**
 * Normalize post.media (and legacy post.image) for rendering.
 * @param {{ media?: unknown, Media?: unknown, image?: string }} post
 * @returns {Array<{ url: string, kind: PostMediaKind, imageVariantUrls?: Record<string, string> | null, imageDisplay?: import('@/lib/imageCropMetadata').ImageDisplayMetadata | null }>}
 */
export function normalizePostMediaForDisplay(post) {
  const media = post?.media ?? post?.Media ?? [];
  if (Array.isArray(media) && media.length > 0) {
    return media
      .map((m) => {
        const url = m.url ?? m.Url ?? '';
        if (!url) {
          return null;
        }
        const mt = m.mediaType ?? m.MediaType;
        const kind = mt ? postMediaKindFromApiType(mt) : postMediaKindFromUrl(url);
        const rawVariants = m.imageVariantUrls ?? m.ImageVariantUrls;
        const imageVariantUrls =
          rawVariants && typeof rawVariants === 'object' && !Array.isArray(rawVariants) ? rawVariants : null;
        const imageDisplay = normalizeImageDisplayFromApi(m.imageDisplay ?? m.ImageDisplay);
        return { url, kind, imageVariantUrls, imageDisplay };
      })
      .filter(Boolean);
  }
  if (post?.image) {
    return [{ url: post.image, kind: postMediaKindFromUrl(post.image) }];
  }
  return [];
}
