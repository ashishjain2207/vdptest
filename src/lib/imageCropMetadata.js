/** @typedef {{ mode: 'fit' | 'crop', aspectRatio?: number, crop?: { x: number, y: number, width: number, height: number } }} ImageDisplayMetadata */

const FILE_META_KEY = '__imageDisplayMetadata';

/**
 * @param {unknown} raw
 * @returns {'fit' | 'crop' | null}
 */
function normalizeDisplayMode(raw) {
  if (typeof raw !== 'string') {
    return null;
  }
  const mode = raw.trim().toLowerCase();
  if (mode === 'fit') {
    return 'fit';
  }
  if (mode === 'crop') {
    return 'crop';
  }
  return null;
}

/**
 * @param {{ mode?: string, aspectRatio?: number, crop?: { x: number, y: number, width: number, height: number } | null }} input
 * @returns {ImageDisplayMetadata | null}
 */
export function buildImageDisplayMetadata(input) {
  const mode = normalizeDisplayMode(input?.mode);
  if (!mode) {
    return null;
  }

  /** @type {ImageDisplayMetadata} */
  const meta = { mode };
  if (typeof input.aspectRatio === 'number' && Number.isFinite(input.aspectRatio) && input.aspectRatio > 0) {
    meta.aspectRatio = input.aspectRatio;
  }
  if (mode === 'crop' && input.crop && input.crop.width > 0 && input.crop.height > 0) {
    meta.crop = {
      x: input.crop.x,
      y: input.crop.y,
      width: input.crop.width,
      height: input.crop.height,
    };
  }
  return meta;
}

/**
 * @param {File} file
 * @param {ImageDisplayMetadata | null | undefined} meta
 * @returns {File}
 */
export function attachImageDisplayMetadata(file, meta) {
  if (!file || !meta) {
    return file;
  }
  Object.defineProperty(file, FILE_META_KEY, {
    value: meta,
    enumerable: false,
    configurable: true,
  });
  return file;
}

/**
 * @param {File | null | undefined} file
 * @returns {ImageDisplayMetadata | null}
 */
export function getImageDisplayMetadataFromFile(file) {
  if (!file) {
    return null;
  }
  const meta = file[FILE_META_KEY];
  return normalizeImageDisplayFromApi(meta);
}

/**
 * @param {unknown} raw
 * @returns {ImageDisplayMetadata | null}
 */
export function normalizeImageDisplayFromApi(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = /** @type {Record<string, unknown>} */ (raw);
  const modeRaw = obj.mode ?? obj.Mode;
  const mode = normalizeDisplayMode(modeRaw);
  if (!mode) {
    return null;
  }

  /** @type {ImageDisplayMetadata} */
  const meta = { mode };
  const aspect = obj.aspectRatio ?? obj.AspectRatio;
  if (typeof aspect === 'number' && Number.isFinite(aspect) && aspect > 0) {
    meta.aspectRatio = aspect;
  }

  const cropRaw = obj.crop ?? obj.Crop;
  if (cropRaw && typeof cropRaw === 'object') {
    const c = /** @type {Record<string, unknown>} */ (cropRaw);
    const x = Number(c.x ?? c.X);
    const y = Number(c.y ?? c.Y);
    const width = Number(c.width ?? c.Width);
    const height = Number(c.height ?? c.Height);
    if (width > 0 && height > 0) {
      meta.crop = { x, y, width, height };
    }
  }

  return meta;
}

/**
 * Display metadata for a pre-cropped cover/banner JPEG (object-cover at render time).
 * @param {number} aspectRatio
 * @returns {{ mode: 'crop', aspectRatio: number }}
 */
export function buildCoverCropMetadata(aspectRatio) {
  return buildImageDisplayMetadata({ mode: 'crop', aspectRatio });
}

/**
 * Legacy fit metadata is treated as crop at render time (no letterboxing).
 * @param {ImageDisplayMetadata | null | undefined} meta
 * @returns {ImageDisplayMetadata | null}
 */
export function normalizeCoverDisplayMetadata(meta) {
  const normalized = normalizeImageDisplayFromApi(meta);
  if (!normalized) {
    return null;
  }
  if (normalized.mode === 'fit') {
    return { mode: 'crop', aspectRatio: normalized.aspectRatio };
  }
  return normalized;
}

/**
 * @param {ImageDisplayMetadata | null | undefined} meta
 * @returns {boolean}
 */
export function isFitImageDisplay(meta) {
  return normalizeImageDisplayFromApi(meta)?.mode === 'fit';
}

/**
 * @param {ImageDisplayMetadata | null | undefined} meta
 * @returns {boolean}
 */
export function isCropImageDisplay(meta) {
  const normalized = normalizeImageDisplayFromApi(meta);
  return !normalized || normalized.mode === 'crop';
}

/**
 * @param {ImageDisplayMetadata | null | undefined} meta
 * @param {number | undefined} fallback
 * @returns {number | undefined}
 */
export function resolveDisplayAspectRatio(meta, fallback) {
  const normalized = normalizeImageDisplayFromApi(meta);
  if (normalized?.aspectRatio && normalized.aspectRatio > 0) {
    return normalized.aspectRatio;
  }
  return fallback;
}

/**
 * @param {Array<File | null | undefined>} files
 * @returns {string | null}
 */
export function serializeImageDisplayMetaForUpload(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return null;
  }
  const list = files.map((f) => getImageDisplayMetadataFromFile(f));
  if (!list.some(Boolean)) {
    return null;
  }
  return JSON.stringify(list);
}
