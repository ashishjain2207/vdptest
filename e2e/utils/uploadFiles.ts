import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '..', 'test-data', 'uploads');

export const uploadFiles = {
  validProfileAvatar: path.join(uploadsRoot, 'valid-avatar.svg'),
  validProfileCover: path.join(uploadsRoot, 'valid-cover.svg'),
  unsupportedMediaFile: path.join(uploadsRoot, 'unsupported-media.exe'),
  invalidProfilePictureFile: path.join(uploadsRoot, 'invalid-profile-picture.exe'),
} as const;
