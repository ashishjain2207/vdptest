const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function uniqueUsername(prefix = 'e2e-user'): string {
  return `${prefix}-${runId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
}

export function uniqueEmail(prefix = 'e2e.user', domain = 'example.test'): string {
  return `${prefix}.${runId}@${domain}`.toLowerCase();
}

export function uniqueDisplayName(prefix = 'E2E User'): string {
  return `${prefix} ${runId}`;
}

export function uniquePostText(prefix = 'Playwright E2E post'): string {
  return `${prefix} ${runId}`;
}

export function uniqueComment(prefix = 'Playwright E2E comment'): string {
  return `${prefix} ${runId}`;
}

export function uniqueMessage(prefix = 'Playwright E2E message'): string {
  return `${prefix} ${runId}`;
}
