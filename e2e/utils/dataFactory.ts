import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const e2eRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readTestData<T>(relativePathFromE2E: string): T {
  const filePath = path.resolve(e2eRoot, relativePathFromE2E);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function uniqueSuffix(prefix = 'e2e'): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function uniqueUsername(prefix = 'testuser'): string {
  return `${prefix}-${uniqueSuffix('user')}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
}

export function uniqueEmail(prefix = 'testuser', domain = 'example.com'): string {
  return `${prefix}+${uniqueSuffix('mail')}@${domain}`;
}

export function uniquePostText(template = 'Automated E2E post'): string {
  return `${template} ${uniqueSuffix('post')}`;
}

export function uniqueCommentText(template = 'Automated E2E comment'): string {
  return `${template} ${uniqueSuffix('comment')}`;
}

export type RegistrationInput = {
  fullName: string;
  usernamePrefix?: string;
  username?: string;
  emailPrefix?: string;
  emailDomain?: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  dateOfBirth?: string;
  homeCountry?: string;
  acceptTerms?: boolean;
};

export function buildUniqueRegistrationData(template: RegistrationInput): RegistrationInput {
  return {
    ...template,
    username: template.username ?? uniqueUsername(template.usernamePrefix ?? 'testuser'),
    email: template.email ?? uniqueEmail(template.emailPrefix ?? 'testuser', template.emailDomain ?? 'example.com'),
    confirmPassword: template.confirmPassword ?? template.password,
  };
}
