import { describe, it, expect } from 'vitest';
import { buildPostImageCropQueue } from './postImageCrop';

describe('postImageCrop', () => {
  it('queues raster images and passes through videos', () => {
    const image = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
    const video = new File(['b'], 'b.mp4', { type: 'video/mp4' });
    const { rasterItems, passthrough } = buildPostImageCropQueue([image, video], [], 'EN');
    expect(rasterItems).toHaveLength(1);
    expect(rasterItems[0].config.aspectRatio).toBe(16 / 9);
    expect(passthrough).toEqual([video]);
  });

  it('uses square crop when composer already has an image', () => {
    const existing = new File(['x'], 'x.jpg', { type: 'image/jpeg' });
    const incoming = new File(['y'], 'y.jpg', { type: 'image/jpeg' });
    const { rasterItems } = buildPostImageCropQueue([incoming], [existing], 'EN');
    expect(rasterItems[0].config.aspectRatio).toBe(1);
  });
});
