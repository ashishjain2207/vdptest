import { beforeEach, describe, expect, it } from 'vitest';
import { getHomeCountryCode, setHomeCountryCode } from './activeCountry.js';

describe('activeCountry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears persisted home country when code is null', () => {
    setHomeCountryCode('DE');
    expect(getHomeCountryCode()).toBe('DE');

    setHomeCountryCode(null);

    expect(getHomeCountryCode()).toBeNull();
  });
});
