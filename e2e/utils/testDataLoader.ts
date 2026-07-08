import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDataRoot = path.resolve(__dirname, '..', 'test-data');

export function loadTestData<T>(fileName: string): T {
  const filePath = path.join(testDataRoot, fileName);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

export function testDataPath(...segments: string[]): string {
  return path.join(testDataRoot, ...segments);
}
