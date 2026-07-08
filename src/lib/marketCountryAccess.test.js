import { describe, expect, it } from 'vitest';
import { staffCanPublishToSelectedMarket } from './marketCountryAccess';

describe('marketCountryAccess', () => {
  it('allows regular users without an explicit scope', () => {
    expect(staffCanPublishToSelectedMarket(false, null)).toBe(true);
  });

  it('requires platform staff to select a country before posting', () => {
    expect(staffCanPublishToSelectedMarket(true, null)).toBe(false);
    expect(staffCanPublishToSelectedMarket(true, 'DE')).toBe(true);
  });
});
