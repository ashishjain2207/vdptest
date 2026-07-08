import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mediaRoot = resolve(workspaceRoot, 'test-data', 'media');

export function mediaFixturePath(fileName: string): string {
  return resolve(mediaRoot, fileName);
}
