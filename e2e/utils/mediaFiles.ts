import { testDataPath } from './testDataLoader';

export function unsupportedUploadPath(fileName = 'unsupported-upload.txt'): string {
  return testDataPath('media', fileName);
}
