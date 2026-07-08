export interface RegistrationRuntimeData {
  fullName: string;
  username: string;
  email: string;
}

export function uniqueSuffix(prefix = 'pw'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

export function uniqueFullName(base = 'IMRIVA Playwright User'): string {
  return `${base} ${uniqueSuffix('user')}`;
}

export function uniqueUsername(base = 'imriva-user'): string {
  return `${base}-${uniqueSuffix('acct')}`.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
}

export function uniqueEmail(base = 'imriva-user', domain = 'example.com'): string {
  return `${base}-${uniqueSuffix('mail')}@${domain}`.toLowerCase();
}

export function uniquePostText(base = 'IMRIVA generated post'): string {
  return `${base} ${uniqueSuffix('post')}`;
}

export function uniqueCommentText(base = 'IMRIVA generated comment'): string {
  return `${base} ${uniqueSuffix('comment')}`;
}

export function buildRegistrationRuntimeData(): RegistrationRuntimeData {
  return {
    fullName: uniqueFullName(),
    username: uniqueUsername(),
    email: uniqueEmail(),
  };
}

export function replaceTemplateTokens(input: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (value, [token, replacement]) => value.replaceAll(`{{${token}}}`, replacement),
    input,
  );
}

export function resolveTemplateData<T>(input: T, replacements: Record<string, string>): T {
  if (typeof input === 'string') {
    return replaceTemplateTokens(input, replacements) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => resolveTemplateData(item, replacements)) as T;
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, resolveTemplateData(value, replacements)]),
    ) as T;
  }

  return input;
}
