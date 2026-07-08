import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '..', 'test-data', 'uploads');

export function resolveUploadFixturePath(fileName: string): string {
  return path.join(UPLOAD_DIR, fileName);
}

export const UPLOAD_FIXTURES = {
  avatarValid: resolveUploadFixturePath('avatar-valid.svg'),
  coverValid: resolveUploadFixturePath('cover-valid.svg'),
  invalidText: resolveUploadFixturePath('invalid-upload.txt'),
};
