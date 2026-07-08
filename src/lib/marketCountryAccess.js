/**
 * Platform staff must pick an explicit country scope before publishing market-scoped content.
 * Regular users always publish to their home country (enforced server-side).
 *
 * @param {boolean} isPlatformStaff
 * @param {string | null | undefined} selectedScopeCountry
 * @returns {boolean}
 */
export function staffCanPublishToSelectedMarket(isPlatformStaff, selectedScopeCountry) {
  if (!isPlatformStaff) {
    return true;
  }
  return Boolean(String(selectedScopeCountry ?? '').trim());
}
