import path from 'node:path';

export const storageStateDirectory = path.resolve(process.cwd(), 'e2e/.auth');

export const storageStatePaths = {
  normalUser: path.join(storageStateDirectory, 'normal-user.json'),
  adminUser: path.join(storageStateDirectory, 'admin-user.json'),
};

export function storageStateFileName(roleName: 'normalUser' | 'adminUser'): string {
  return roleName === 'adminUser' ? 'admin-user.json' : 'normal-user.json';
}
