import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const e2eRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const storageStateDir = path.join(e2eRoot, '.auth');

export type AuthRole = 'normalUser' | 'adminUser';

export function storageStatePath(role: AuthRole): string {
  fs.mkdirSync(storageStateDir, { recursive: true });
  return path.join(storageStateDir, `${role}.json`);
}

export function hasStorageState(role: AuthRole): boolean {
  return fs.existsSync(storageStatePath(role));
}
