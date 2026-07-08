import { resolve } from 'node:path';

export function mediaFixturePath(fileName: string): string {
  return resolve(process.cwd(), 'e2e', 'test-data', 'media', fileName);
}
