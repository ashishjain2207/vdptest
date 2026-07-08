import { getE2EConfig } from './env';

type Primitive = string | number | boolean | null;
type JsonLike = Primitive | JsonLike[] | { [key: string]: JsonLike };

export interface RuntimeTemplateTokens {
  timestamp: string;
  randomSuffix: string;
  uniqueUsername: string;
  uniqueEmail: string;
  uniqueDisplayName: string;
  uniquePostText: string;
  uniqueCommentText: string;
  existingUsername: string;
  normalUserHandle: string;
  secondaryUserHandle: string;
}

function randomSuffix(length = 6): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function createRuntimeTemplateTokens(prefix = 'e2e'): RuntimeTemplateTokens {
  const config = getE2EConfig();
  const timestamp = Date.now().toString();
  const suffix = randomSuffix();
  const uniqueUsername = `${prefix}-${suffix}`.replace(/[^a-z0-9_-]/giu, '-').toLowerCase();
  const uniqueEmail = `${uniqueUsername}@example.test`;

  return {
    timestamp,
    randomSuffix: suffix,
    uniqueUsername,
    uniqueEmail,
    uniqueDisplayName: `Playwright ${prefix} ${suffix}`,
    uniquePostText: `Playwright post ${timestamp}-${suffix}`,
    uniqueCommentText: `Playwright comment ${timestamp}-${suffix}`,
    existingUsername: config.existingUsername,
    normalUserHandle: config.normalUser.handle ?? '',
    secondaryUserHandle: config.secondaryUser.handle ?? '',
  };
}

function replaceTemplate(input: string, tokens: RuntimeTemplateTokens): string {
  return input.replace(/\{\{(\w+)\}\}/gu, (_match, tokenName: keyof RuntimeTemplateTokens) => {
    const value = tokens[tokenName];
    return typeof value === 'string' ? value : '';
  });
}

export function interpolateFixtureData<T extends JsonLike>(input: T, tokens: RuntimeTemplateTokens): T {
  if (typeof input === 'string') {
    return replaceTemplate(input, tokens) as T;
  }

  if (Array.isArray(input)) {
    return input.map((value) => interpolateFixtureData(value, tokens)) as T;
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, interpolateFixtureData(value as JsonLike, tokens)]),
    ) as T;
  }

  return input;
}
