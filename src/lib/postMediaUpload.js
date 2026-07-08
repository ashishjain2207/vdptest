import {
  POST_MEDIA_MAX_INPUT_IMAGE_BYTES,
  POST_MEDIA_MAX_INPUT_VIDEO_BYTES,
  formatFileSize,
} from '@/lib/postMedia';
import { isFileAllowedByUploadPolicy } from '@/lib/uploadPolicyChecks';

/**
 * @param {File} file
 * @returns {{ ok: true } | { ok: false, messageKey: string, messageParams: Record<string, string | number> }}
 */
export function validatePostMediaFile(file, policy) {
  const limit = file.type.startsWith('video/')
    ? POST_MEDIA_MAX_INPUT_VIDEO_BYTES
    : POST_MEDIA_MAX_INPUT_IMAGE_BYTES;
  if (file.size > limit) {
    return {
      ok: false,
      messageKey: 'posts.fileTooLarge',
      messageParams: { name: file.name, max: formatFileSize(limit) },
    };
  }
  if (policy && !isFileAllowedByUploadPolicy(file, policy)) {
    return {
      ok: false,
      messageKey: 'posts.fileTypeNotAllowed',
      messageParams: { name: file.name },
    };
  }
  return { ok: true };
}

/**
 * Append new files with validation; toast messages should be shown by caller for each error.
 * @param {File[]} incoming
 * @param {File[]} current
 * @param {number} maxTotal
 * @returns {{ next: File[], errors: Array<{ messageKey: string, messageParams?: Record<string, string | number> }> }}
 */
export function mergeValidatedPostMediaFiles(incoming, current, maxTotal, policy) {
  const next = [...current];
  /** @type {Array<{ messageKey: string, messageParams?: Record<string, string | number> }>} */
  const errors = [];

  for (const file of incoming) {
    if (next.length >= maxTotal) {
      errors.push({
        messageKey: 'posts.maxFilesExceeded',
        messageParams: { max: maxTotal },
      });
      break;
    }
    const v = validatePostMediaFile(file, policy);
    if (!v.ok) {
      errors.push({ messageKey: v.messageKey, messageParams: v.messageParams });
      continue;
    }
    next.push(file);
  }

  return { next, errors };
}
