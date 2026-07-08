import path from 'node:path';
import { fileURLToPath } from 'node:url';

const e2eRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uploadsRoot = path.join(e2eRoot, 'test-data', 'uploads');

export const uploadFiles = {
  unsupportedPostMedia: path.join(uploadsRoot, 'unsupported-media.exe'),
  invalidProfilePicture: path.join(uploadsRoot, 'invalid-profile-picture.exe'),
  supportedProfilePicture: path.join(uploadsRoot, 'profile-picture.svg'),
  supportedCoverPhoto: path.join(uploadsRoot, 'cover-photo.svg'),
};
