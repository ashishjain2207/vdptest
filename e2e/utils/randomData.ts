export type RegistrationData = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  country: string;
};

const runId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function uniqueSuffix(prefix = 'e2e'): string {
  return `${prefix}-${runId()}`;
}

export function uniqueUsername(prefix = 'e2euser'): string {
  return `${prefix}_${runId()}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
}

export function uniqueEmail(prefix = 'e2e-user', domain = 'example.test'): string {
  return `${prefix}+${runId()}@${domain}`;
}

export function uniquePostText(prefix = 'E2E text post'): string {
  return `${prefix} ${runId()}`;
}

export function uniqueComment(prefix = 'E2E comment'): string {
  return `${prefix} ${runId()}`;
}

export function uniqueMessage(prefix = 'E2E private message'): string {
  return `${prefix} ${runId()}`;
}

export function uniqueRegistrationData(overrides: Partial<RegistrationData> = {}): RegistrationData {
  const username = overrides.username ?? uniqueUsername();
  return {
    displayName: overrides.displayName ?? `E2E User ${runId()}`,
    username,
    email: overrides.email ?? uniqueEmail(username),
    password: overrides.password ?? process.env.E2E_NEW_USER_PASSWORD ?? 'E2ePassword!234',
    country: overrides.country ?? process.env.E2E_DEFAULT_COUNTRY ?? 'Germany',
  };
}
