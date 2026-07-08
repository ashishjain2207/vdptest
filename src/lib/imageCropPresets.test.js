import { describe, expect, it } from 'vitest';
import {
  resolvePostImageCropPresetKey,
  getImageCropConfig,
  croppedBlobToImageFile,
  createMaxAspectCrop,
} from './imageCropPresets';
import { convertToPixelCrop } from 'react-image-crop';

describe('imageCropPresets', () => {
  it('uses grid crop when multiple post images', () => {
    expect(resolvePostImageCropPresetKey(0, 2)).toBe('postGrid');
    expect(resolvePostImageCropPresetKey(1, 1)).toBe('postGrid');
    expect(resolvePostImageCropPresetKey(0, 1)).toBe('postSingle');
  });

  it('returns localized crop titles', () => {
    expect(getImageCropConfig('eventCover', 'EN').title).toBe('Adjust cover image');
    expect(getImageCropConfig('eventCover', 'DE').title).toBe('Titelbild anpassen');
  });

  it('returns aspect labels for each preset', () => {
    expect(getImageCropConfig('cover', 'EN').aspectLabel).toBe('4:1');
    expect(getImageCropConfig('postSingle', 'EN').aspectLabel).toBe('16:9');
    expect(getImageCropConfig('adBanner', 'EN').aspectLabel).toBe('16:9');
    expect(getImageCropConfig('adSidebar', 'EN').aspectLabel).toBe('5:3');
    expect(getImageCropConfig('adSidebar', 'EN').aspectRatio).toBe(5 / 3);
    expect(getImageCropConfig('avatar', 'EN').aspectLabel).toBe('1:1');
    expect(getImageCropConfig('adLogo', 'EN').aspectLabel).toBe('1:1');
  });

  it('builds jpeg file from cropped blob', () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const file = croppedBlobToImageFile(blob, 'photo.png', 'image');
    expect(file.name).toBe('photo.jpg');
    expect(file.type).toBe('image/jpeg');
  });

  it('creates the largest centered crop for the target aspect ratio', () => {
    const crop = createMaxAspectCrop(1600, 900, 16 / 9);
    const pixel = convertToPixelCrop(crop, 1600, 900);
    expect(pixel.width / pixel.height).toBeCloseTo(16 / 9, 2);
    expect(pixel.width).toBe(1600);
    expect(pixel.height).toBe(900);
  });

  it('fits wide cover aspect inside a square image', () => {
    const crop = createMaxAspectCrop(1000, 1000, 4);
    const pixel = convertToPixelCrop(crop, 1000, 1000);
    expect(pixel.width / pixel.height).toBeCloseTo(4, 2);
    expect(pixel.width).toBe(1000);
    expect(pixel.height).toBe(250);
  });
});
