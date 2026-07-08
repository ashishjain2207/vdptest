import { describe, expect, it } from 'vitest';
import {
  filterCountryCatalog,
  formatCountryOptionLabel,
  getAllCountriesForPicker,
  getAllIsoCountryCodes,
  getCountryMarketStatus,
  getPopularCountriesForPicker,
  isLiveMarketCountry,
  LIVE_MARKET_COUNTRY_CODES,
  POPULAR_COUNTRY_CODES,
} from './marketCountryCodes.js';

describe('marketCountryCodes', () => {
  it('returns many ISO codes', () => {
    const codes = getAllIsoCountryCodes();
    expect(codes.length).toBeGreaterThan(100);
    expect(codes).toContain('DE');
    expect(codes).toContain('BR');
  });

  it('exposes popular countries for default picker view', () => {
    const popular = getPopularCountriesForPicker('EN');
    expect(popular.length).toBe(POPULAR_COUNTRY_CODES.length);
    expect(popular.some((e) => e.code === 'DE')).toBe(true);
  });

  it('searches full catalog by name or code', () => {
    const all = getAllCountriesForPicker('EN');
    const byName = filterCountryCatalog(all, 'germ');
    expect(byName.some((e) => e.code === 'DE')).toBe(true);

    const byCode = filterCountryCatalog(all, 'br');
    expect(byCode.some((e) => e.code === 'BR')).toBe(true);
  });

  it('keeps feature-level live market check separate from picker', () => {
    expect(isLiveMarketCountry('DE')).toBe(true);
    expect(getCountryMarketStatus('BR')).toBe('coming_soon');
    expect(LIVE_MARKET_COUNTRY_CODES).toContain('US');
  });

  it('formats option label with code', () => {
    const label = formatCountryOptionLabel('DE', 'EN');
    expect(label).toMatch(/\(DE\)/);
  });
});
