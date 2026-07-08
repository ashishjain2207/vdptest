import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadTestData<T>(relativePath: string): T {
  const absolutePath = resolve(process.cwd(), 'e2e', relativePath);
  return JSON.parse(readFileSync(absolutePath, 'utf-8')) as T;
}
