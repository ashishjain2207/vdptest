import {
  getImageCropConfig,
  isRasterImageFile,
  resolvePostImageCropPresetKey,
} from '@/lib/imageCropPresets';
import { postMediaKindFromFile } from '@/lib/postMedia';

/**
 * Split file picker results and build crop queue items for raster images.
 * @param {File[]} picked
 * @param {File[]} existingFiles
 * @param {'EN' | 'DE' | string} language
 * @param {number} [existingImageCountOverride] — include server-side images in edit composer
 * @returns {{ rasterItems: Array<{ file: File, config: { aspectRatio: number, isCircular: boolean, title?: string } }>, passthrough: File[] }}
 */
export function buildPostImageCropQueue(picked, existingFiles, language, existingImageCountOverride) {
  const passthrough = [];
  const rasterFiles = [];
  for (const file of picked) {
    if (isRasterImageFile(file)) {
      rasterFiles.push(file);
    } else {
      passthrough.push(file);
    }
  }
  const existingImageCount =
    existingImageCountOverride ??
    existingFiles.filter((f) => postMediaKindFromFile(f) === 'image').length;
  const presetKey = resolvePostImageCropPresetKey(existingImageCount, rasterFiles.length);
  const config = getImageCropConfig(presetKey, language);
  const rasterItems = rasterFiles.map((file) => ({ file, config }));
  return { rasterItems, passthrough };
}
