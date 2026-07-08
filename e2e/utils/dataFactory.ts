type RegistrationTemplate = {
  fullName: string;
  usernamePrefix: string;
  emailPrefix: string;
  emailDomain: string;
  password: string;
  dateOfBirth: string;
};

const runSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function uniqueValue(prefix: string): string {
  return `${prefix}-${runSuffix}`;
}

export function uniqueUsername(prefix = 'e2e-user'): string {
  return uniqueValue(prefix).replace(/[^a-zA-Z0-9_-]/g, '');
}

export function uniqueEmail(prefix = 'e2e', domain = 'example.test'): string {
  return `${uniqueValue(prefix).replace(/[^a-zA-Z0-9._-]/g, '')}@${domain}`;
}

export function uniquePostText(prefix = 'Playwright E2E post'): string {
  return `${prefix} ${runSuffix}`;
}

export function uniqueCommentText(prefix = 'Playwright E2E comment'): string {
  return `${prefix} ${runSuffix}`;
}

export function buildRegistrationData(template: RegistrationTemplate): {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
} {
  return {
    fullName: template.fullName,
    username: uniqueUsername(template.usernamePrefix),
    email: uniqueEmail(template.emailPrefix, template.emailDomain),
    password: template.password,
    confirmPassword: template.password,
    dateOfBirth: template.dateOfBirth,
  };
}
