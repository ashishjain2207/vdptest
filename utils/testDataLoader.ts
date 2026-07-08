import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const testDataDir = path.resolve(currentDir, '..', 'test-data');

export function loadTestData<T>(fileName: string): T {
  const filePath = path.join(testDataDir, fileName);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}
