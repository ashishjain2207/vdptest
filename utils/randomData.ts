const runId = process.env.E2E_RUN_ID ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function uniqueUsername(prefix = 'e2euser'): string {
  return normalize(`${prefix}${runId}`).slice(0, 32);
}

export function uniqueEmail(prefix = 'e2e.user', domain = 'example.test'): string {
  return `${normalize(prefix)}+${normalize(runId)}@${domain}`;
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
