import { describe, expect, it } from 'vitest';
import {
  attachImageDisplayMetadata,
  buildCoverCropMetadata,
  buildImageDisplayMetadata,
  getImageDisplayMetadataFromFile,
  isFitImageDisplay,
  normalizeCoverDisplayMetadata,
  normalizeImageDisplayFromApi,
  serializeImageDisplayMetaForUpload,
} from '@/lib/imageCropMetadata';

describe('imageCropMetadata', () => {
  it('builds and normalizes fit metadata', () => {
    const meta = buildImageDisplayMetadata({ mode: 'fit', aspectRatio: 16 / 9 });
    expect(meta).toEqual({ mode: 'fit', aspectRatio: 16 / 9 });
    expect(isFitImageDisplay(meta)).toBe(true);
    expect(normalizeImageDisplayFromApi({ Mode: 'fit', AspectRatio: 1.7777777777777777 })).toEqual({
      mode: 'fit',
      aspectRatio: 1.7777777777777777,
    });
  });

  it('normalizes display mode case-insensitively', () => {
    expect(buildImageDisplayMetadata({ mode: 'Fit', aspectRatio: 1 })).toEqual({ mode: 'fit', aspectRatio: 1 });
    expect(buildImageDisplayMetadata({ mode: 'CROP', aspectRatio: 1 })).toEqual({ mode: 'crop', aspectRatio: 1 });
    expect(normalizeImageDisplayFromApi({ Mode: 'Fit', AspectRatio: 2 })).toEqual({ mode: 'fit', aspectRatio: 2 });
    expect(normalizeImageDisplayFromApi({ mode: 'Crop', aspectRatio: 1 })).toEqual({ mode: 'crop', aspectRatio: 1 });
  });

  it('attaches metadata to files for upload serialization', () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    attachImageDisplayMetadata(file, { mode: 'fit', aspectRatio: 1 });
    expect(getImageDisplayMetadataFromFile(file)).toEqual({ mode: 'fit', aspectRatio: 1 });
    expect(serializeImageDisplayMetaForUpload([file])).toBe('[{"mode":"fit","aspectRatio":1}]');
  });

  it('includes crop rectangle for crop mode', () => {
    const meta = buildImageDisplayMetadata({
      mode: 'crop',
      aspectRatio: 1,
      crop: { x: 10, y: 20, width: 100, height: 100 },
    });
    expect(meta?.crop).toEqual({ x: 10, y: 20, width: 100, height: 100 });
  });

  it('builds cover crop metadata for pre-baked exports', () => {
    expect(buildCoverCropMetadata(4)).toEqual({ mode: 'crop', aspectRatio: 4 });
  });

  it('maps legacy fit metadata to crop for display', () => {
    expect(normalizeCoverDisplayMetadata({ mode: 'fit', aspectRatio: 16 / 9 })).toEqual({
      mode: 'crop',
      aspectRatio: 16 / 9,
    });
    expect(normalizeCoverDisplayMetadata({ mode: 'crop', aspectRatio: 4 })).toEqual({
      mode: 'crop',
      aspectRatio: 4,
    });
  });
});
