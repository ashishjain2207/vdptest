const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function uniqueUsername(prefix = 'e2euser'): string {
  return `${prefix}-${runId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
}

export function uniqueEmail(prefix = 'e2euser', domain = 'example.com'): string {
  return `${prefix}.${runId.replace(/[^a-zA-Z0-9]/g, '')}@${domain}`;
}

export function uniquePostText(prefix = 'E2E post'): string {
  return `${prefix} ${runId}`;
}

export function uniqueComment(prefix = 'E2E comment'): string {
  return `${prefix} ${runId}`;
}

export function uniqueMessage(prefix = 'E2E message'): string {
  return `${prefix} ${runId}`;
}
