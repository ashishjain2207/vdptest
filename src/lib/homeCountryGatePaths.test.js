import { describe, expect, it } from 'vitest';
import { isHomeCountryExemptPath, isHomeCountryRequiredPath } from './homeCountryGatePaths';

describe('homeCountryGatePaths', () => {
  it('requires home country on feed, messaging, and profile routes', () => {
    expect(isHomeCountryRequiredPath('/posts')).toBe(true);
    expect(isHomeCountryRequiredPath('/explore/tag/foo')).toBe(true);
    expect(isHomeCountryRequiredPath('/people')).toBe(true);
    expect(isHomeCountryRequiredPath('/events/abc')).toBe(true);
    expect(isHomeCountryRequiredPath('/event/abc')).toBe(true);
    expect(isHomeCountryRequiredPath('/messages')).toBe(true);
    expect(isHomeCountryRequiredPath('/notifications')).toBe(true);
    expect(isHomeCountryRequiredPath('/profile/u1')).toBe(true);
  });

  it('exempts staff tools, settings, and onboarding', () => {
    expect(isHomeCountryRequiredPath('/support/inbox')).toBe(false);
    expect(isHomeCountryRequiredPath('/support/content-moderation')).toBe(false);
    expect(isHomeCountryRequiredPath('/admin/users')).toBe(false);
    expect(isHomeCountryRequiredPath('/settings/profile')).toBe(false);
    expect(isHomeCountryRequiredPath('/onboarding')).toBe(false);
    expect(isHomeCountryRequiredPath('/onboarding?returnUrl=%2Fposts')).toBe(false);
  });

  it('exempts public auth paths', () => {
    expect(isHomeCountryExemptPath('/login')).toBe(true);
    expect(isHomeCountryExemptPath('/maintenance')).toBe(true);
    expect(isHomeCountryExemptPath('/onboarding')).toBe(true);
  });
});
