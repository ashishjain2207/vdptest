import { readFileSync } from 'node:fs';

export function loadTestData<T>(fileName: string): T {
  const fileUrl = new URL(`../test-data/${fileName}`, import.meta.url);
  const raw = readFileSync(fileUrl, 'utf-8');
  return JSON.parse(raw) as T;
}
