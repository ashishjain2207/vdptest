import { centerCrop, makeAspectCrop } from 'react-image-crop';
import { IMAGE_CONSTRAINTS } from '@/utils/imageValidation';
import { attachImageDisplayMetadata } from '@/lib/imageCropMetadata';

/** @typedef {'avatar' | 'cover' | 'postSingle' | 'postGrid' | 'eventCover' | 'adBanner' | 'adSidebar' | 'adLogo' | 'partnerLogo' | 'partnerCover'} ImageCropPresetKey */

/** Wide profile/partner/event cover (4:1). */
export const COVER_BANNER_ASPECT_RATIO = IMAGE_CONSTRAINTS.COVER.COVER_CROP_ASPECT_RATIO;

/** Feed single-image and ad feed placement (16:9). */
export const FEED_WIDE_ASPECT_RATIO = 16 / 9;

/** Sidebar ad creative frame (5:3), matches PlatformAdCard rendering. */
export const SIDEBAR_AD_ASPECT_RATIO = 5 / 3;

/** Multi-image post tiles (1:1). */
export const FEED_GRID_ASPECT_RATIO = 1;

/**
 * Best default crop: largest centered region at the target aspect ratio.
 * @param {number} mediaWidth
 * @param {number} mediaHeight
 * @param {number} aspect
 */
export function createMaxAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 100 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

/** @alias createMaxAspectCrop */
export const createDefaultCoverCrop = createMaxAspectCrop;

export const IMAGE_CROP_PRESETS = {
  avatar: {
    aspectRatio: 1,
    aspectLabel: '1:1',
    isCircular: true,
    titleEn: 'Adjust profile photo',
    titleDe: 'Profilfoto anpassen',
  },
  cover: {
    aspectRatio: COVER_BANNER_ASPECT_RATIO,
    aspectLabel: '4:1',
    isCircular: false,
    titleEn: 'Adjust cover image',
    titleDe: 'Titelbild anpassen',
  },
  partnerCover: {
    aspectRatio: COVER_BANNER_ASPECT_RATIO,
    aspectLabel: '4:1',
    isCircular: false,
    titleEn: 'Adjust partner cover',
    titleDe: 'Partner-Titelbild anpassen',
  },
  partnerLogo: {
    aspectRatio: 1,
    aspectLabel: '1:1',
    isCircular: true,
    titleEn: 'Adjust logo',
    titleDe: 'Logo anpassen',
  },
  postSingle: {
    aspectRatio: FEED_WIDE_ASPECT_RATIO,
    aspectLabel: '16:9',
    isCircular: false,
    titleEn: 'Adjust image',
    titleDe: 'Bild anpassen',
  },
  postGrid: {
    aspectRatio: FEED_GRID_ASPECT_RATIO,
    aspectLabel: '1:1',
    isCircular: false,
    titleEn: 'Adjust image',
    titleDe: 'Bild anpassen',
  },
  eventCover: {
    aspectRatio: COVER_BANNER_ASPECT_RATIO,
    aspectLabel: '4:1',
    isCircular: false,
    titleEn: 'Adjust cover image',
    titleDe: 'Titelbild anpassen',
  },
  adBanner: {
    aspectRatio: FEED_WIDE_ASPECT_RATIO,
    aspectLabel: '16:9',
    isCircular: false,
    titleEn: 'Adjust banner image',
    titleDe: 'Bannerbild anpassen',
  },
  adSidebar: {
    aspectRatio: SIDEBAR_AD_ASPECT_RATIO,
    aspectLabel: '5:3',
    isCircular: false,
    titleEn: 'Adjust sidebar image',
    titleDe: 'Seitenleisten-Bild anpassen',
  },
  adLogo: {
    aspectRatio: 1,
    aspectLabel: '1:1',
    isCircular: true,
    titleEn: 'Adjust advertiser logo',
    titleDe: 'Werbelogo anpassen',
  },
};

/**
 * Feed: square tiles when multiple images; widescreen when a single image.
 * @param {number} existingImageCount
 * @param {number} incomingImageCount
 * @returns {ImageCropPresetKey}
 */
export function resolvePostImageCropPresetKey(existingImageCount, incomingImageCount) {
  const total = existingImageCount + incomingImageCount;
  return total > 1 ? 'postGrid' : 'postSingle';
}

/**
 * @param {ImageCropPresetKey} key
 * @param {'EN' | 'DE' | string} language
 */
export function getImageCropConfig(key, language) {
  const preset = IMAGE_CROP_PRESETS[key];
  const isDe = language === 'DE';
  return {
    aspectRatio: preset.aspectRatio,
    aspectLabel: preset.aspectLabel,
    isCircular: preset.isCircular,
    title: isDe ? preset.titleDe : preset.titleEn,
  };
}

/**
 * @param {File} file
 * @returns {boolean}
 */
export function isRasterImageFile(file) {
  return Boolean(file?.type?.startsWith('image/'));
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * @param {Blob} blob
 * @param {string} [originalName]
 * @param {string} [fallbackStem]
 * @param {import('@/lib/imageCropMetadata').ImageDisplayMetadata | null} [displayMeta]
 * @returns {File}
 */
export function croppedBlobToImageFile(blob, originalName, fallbackStem = 'image', displayMeta = null) {
  const stem = String(originalName || fallbackStem)
    .replace(/[/\\]/g, '_')
    .replace(/\.[^.]+$/, '')
    || fallbackStem;
  const file = new File([blob], `${stem}.jpg`, { type: 'image/jpeg' });
  return displayMeta ? attachImageDisplayMetadata(file, displayMeta) : file;
}
