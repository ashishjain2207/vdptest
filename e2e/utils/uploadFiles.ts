import path from 'node:path';

const uploadsRoot = path.resolve(process.cwd(), 'e2e', 'test-data', 'uploads');

export const uploadFiles = {
  unsupportedMedia: path.join(uploadsRoot, 'unsupported-media.exe'),
  invalidProfilePicture: path.join(uploadsRoot, 'invalid-profile-picture.exe'),
  validProfilePicture: path.join(uploadsRoot, 'valid-profile-picture.svg'),
  validCoverPhoto: path.join(uploadsRoot, 'valid-cover-photo.svg'),
};
