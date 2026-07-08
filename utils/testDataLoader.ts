import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const testDataRoot = resolve(workspaceRoot, 'test-data');

export function loadTestData<T>(fileName: string): T {
  const filePath = resolve(testDataRoot, fileName);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}
