import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.resolve(currentDir, '..', 'test-data', 'media');

export function mediaFilePath(fileName: string): string {
  return path.join(mediaDir, fileName);
}
