import { apiPost } from './api/client.js';
import { API_BASE } from '@/lib/config';
import { toUserFacingRequestError } from '@/lib/networkErrorMessage';
import { normalizeImageDisplayFromApi, serializeImageDisplayMetaForUpload } from '@/lib/imageCropMetadata';
import {
  prepareMediaFileForUpload,
  DEFAULT_MAX_OUTPUT_BYTES,
  DEFAULT_HARD_MAX_INPUT_BYTES,
} from '@/lib/mediaOptimize.js';

const base = (API_BASE || '').replace(/\/$/, '');

/** Resolve an absolute URL for URLSearchParams; dev uses relative `/api/...` (must not use `new URL` with a path-only string). */
function apiUrl(path) {
  if (base) {
    return new URL(`${base}${path}`);
  }
  const origin =
    typeof globalThis !== 'undefined' && globalThis.location?.origin
      ? globalThis.location.origin
      : 'http://localhost';
  return new URL(path, origin);
}

/**
 * Upload a single file via `POST /api/Posts/media/upload`.
 * The API defaults to image (`postAttachment`) rules. Pass `policyName: 'streamOnly'` for video/other formats (admin banners, etc.).
 * @param {File} file
 * @param {{ showLoader?: boolean, policyName?: string }} [opts]
 * @returns {Promise<{ mediaFileId: string, publicUrl: string, contentType: string, imageVariantUrls?: Record<string, string> | null, imageDisplay?: import('@/lib/imageCropMetadata').ImageDisplayMetadata | null }>}
 */
export async function uploadPostMediaFile(file, opts = {}) {
  if (file.size > DEFAULT_HARD_MAX_INPUT_BYTES) {
    throw new Error(
      `This file is too large (max ${DEFAULT_HARD_MAX_INPUT_BYTES / (1024 * 1024)} MB). Try a smaller source file.`,
    );
  }

  const maxOut = opts.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const prepared = await prepareMediaFileForUpload(file, {
    maxOutputBytes: maxOut,
    maxDurationSec: opts.maxDurationSec,
  });

  const policyName = String(opts.policyName || '').trim();
  const fd = new FormData();
  fd.append('files', prepared);
  const displayMetaJson = serializeImageDisplayMetaForUpload([file]);
  if (displayMetaJson) {
    fd.append('imageDisplayMeta', displayMetaJson);
  }
  const url = apiUrl('/api/Posts/media/upload');
  if (policyName) {
    url.searchParams.set('policy', policyName);
  }
  let res;
  try {
    res = await apiPost(url.toString(), fd, {
      showLoader: opts.showLoader !== false,
    });
  } catch (e) {
    throw toUserFacingRequestError(e, { upload: true });
  }
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('This file exceeds the maximum upload size. Try a smaller image or compress it before uploading.');
    }
    const err = await res.json().catch(() => ({}));
    const error = new Error(err?.message || err?.title || res.statusText || 'Upload failed');
    error.status = res.status;
    error.code = err?.code;
    throw error;
  }
  const list = await res.json();
  const first = Array.isArray(list) ? list[0] : null;
  const mediaFileId = first?.mediaFileId ?? first?.MediaFileId;
  const publicUrl = first?.publicUrl ?? first?.PublicUrl ?? '';
  const contentType = String(first?.contentType ?? first?.ContentType ?? prepared.type ?? '');
  const rawVariants = first?.imageVariantUrls ?? first?.ImageVariantUrls;
  const imageVariantUrls =
    rawVariants && typeof rawVariants === 'object' && !Array.isArray(rawVariants)
      ? /** @type {Record<string, string>} */ (rawVariants)
      : null;
  const imageDisplay = normalizeImageDisplayFromApi(first?.imageDisplay ?? first?.ImageDisplay);
  if (!mediaFileId) {
    throw new Error('Upload returned no file');
  }
  return { mediaFileId: String(mediaFileId), publicUrl: String(publicUrl), contentType, imageVariantUrls, imageDisplay };
}

/**
 * Compresses each file for multipart post/message uploads (images + best-effort video).
 * @param {File[]} files
 * @param {{ maxOutputBytes?: number, maxDurationSec?: number }} [opts]
 * @returns {Promise<File[]>}
 */
export async function prepareFilesForPostMultipart(files, opts = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const target = opts.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const out = [];
  for (const f of files) {
    if (f.size > DEFAULT_HARD_MAX_INPUT_BYTES) {
      throw new Error(
        `"${f.name}" exceeds the maximum upload size (${DEFAULT_HARD_MAX_INPUT_BYTES / (1024 * 1024)} MB).`,
      );
    }
    out.push(
      await prepareMediaFileForUpload(f, {
        maxOutputBytes: target,
        maxDurationSec: opts.maxDurationSec,
      }),
    );
  }
  return out;
}
