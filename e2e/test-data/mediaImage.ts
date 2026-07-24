import { FilePayload } from '../pages/feedComposerPage';

// Tiny deterministic 1x1 PNG test image.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2b8xkAAAAASUVORK5CYII=';

export const STABLE_MEDIA_IMAGE: FilePayload = {
  name: 'feed-composer-media.png',
  mimeType: 'image/png',
  buffer: Buffer.from(PNG_BASE64, 'base64'),
};
