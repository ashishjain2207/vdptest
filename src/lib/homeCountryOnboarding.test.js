import { describe, expect, it } from 'vitest';
import {
  buildOnboardingRedirectUrl,
  profileHasHomeCountry,
  resolveOnboardingReturnPath,
} from './homeCountryOnboarding';

describe('homeCountryOnboarding', () => {
  it('detects home country on profile', () => {
    expect(profileHasHomeCountry({ homeCountryCode: 'DE' })).toBe(true);
    expect(profileHasHomeCountry({ homeCountryCode: '  ' })).toBe(false);
    expect(profileHasHomeCountry(null)).toBe(false);
  });

  it('builds onboarding redirect with return path', () => {
    expect(buildOnboardingRedirectUrl('/messages')).toBe('/onboarding?returnUrl=%2Fmessages');
    expect(buildOnboardingRedirectUrl('/')).toBe('/onboarding');
    expect(buildOnboardingRedirectUrl('/onboarding')).toBe('/onboarding');
  });

  it('resolves safe return path from query', () => {
    expect(resolveOnboardingReturnPath('/people')).toBe('/people');
    expect(resolveOnboardingReturnPath('//evil')).toBe('/posts');
    expect(resolveOnboardingReturnPath(null)).toBe('/posts');
  });
});
