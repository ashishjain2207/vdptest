import path from 'node:path';

const workspaceRoot = process.cwd();
const uploadRoot = path.resolve(workspaceRoot, 'e2e/test-data/uploads');

export const uploadFiles = {
  supportedAvatar: path.resolve(workspaceRoot, 'public/placeholder.svg'),
  supportedCover: path.resolve(workspaceRoot, 'public/placeholder.svg'),
  unsupportedMedia: path.resolve(uploadRoot, 'unsupported-media.exe'),
  invalidProfilePicture: path.resolve(uploadRoot, 'invalid-profile-picture.exe'),
};
