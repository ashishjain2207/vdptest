import path from 'node:path';

export type AuthRole = 'normal-user' | 'admin-user';

const authStateRoot = path.resolve(process.cwd(), 'e2e', '.auth');

export const storageStatePaths: Record<AuthRole, string> = {
  'normal-user': path.join(authStateRoot, 'normal-user.json'),
  'admin-user': path.join(authStateRoot, 'admin-user.json'),
};

export function storageStatePathForRole(role: AuthRole): string {
  return storageStatePaths[role];
}
