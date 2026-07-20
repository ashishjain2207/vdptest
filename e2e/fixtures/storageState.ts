import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const e2eRoot = path.resolve(__dirname, '..');

export type AuthRole = 'normalUser' | 'adminUser';

export const storageStateDirectory = path.join(e2eRoot, '.auth');
export const storageStatePaths: Record<AuthRole, string> = {
  normalUser: path.join(storageStateDirectory, 'normal-user.json'),
  adminUser: path.join(storageStateDirectory, 'admin-user.json'),
};

export function ensureStorageStateDirectory(): void {
  fs.mkdirSync(storageStateDirectory, { recursive: true });
}

export function storageStatePathFor(role: AuthRole): string {
  ensureStorageStateDirectory();
  return storageStatePaths[role];
}
