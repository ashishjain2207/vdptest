/** @param {unknown} p */
export function isPartnerActive(p) {
  const row = /** @type {{ isActive?: boolean, IsActive?: boolean }} */ (p ?? {});
  return row.isActive !== false && row.IsActive !== false;
}

/** @param {unknown} p */
function isPremiumPartner(p) {
  const row = /** @type {{ tier?: string, Tier?: string, isPremium?: boolean, IsPremium?: boolean }} */ (p ?? {});
  return row.tier === 'Premium' || row.Tier === 'Premium' || row.isPremium === true || row.IsPremium === true;
}

/**
 * Premium partners first, then alphabetical by name (EN locale).
 * @param {unknown[]} items
 * @returns {unknown[]}
 */
function comparePartnerNames(a, b) {
  const ra = /** @type {{ name?: string, Name?: string }} */ (a);
  const rb = /** @type {{ name?: string, Name?: string }} */ (b);
  const an = String(ra.name ?? ra.Name ?? '');
  const bn = String(rb.name ?? rb.Name ?? '');
  return an.localeCompare(bn, undefined, { sensitivity: 'base' });
}

/** Active partners first, then alphabetical by name. */
export function sortPartnersActiveFirst(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return [...items].sort((a, b) => {
    const aa = isPartnerActive(a) ? 1 : 0;
    const ba = isPartnerActive(b) ? 1 : 0;
    if (ba !== aa) {
      return ba - aa;
    }
    return comparePartnerNames(a, b);
  });
}

export function sortPartnersPremiumFirst(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return [...items].sort((a, b) => {
    const ap = isPremiumPartner(a) ? 1 : 0;
    const bp = isPremiumPartner(b) ? 1 : 0;
    if (bp !== ap) {
      return bp - ap;
    }
    return comparePartnerNames(a, b);
  });
}

/** Discovery list: active first (when mixed), premium tier, then name. */
export function sortPartnersForDiscovery(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return [...items].sort((a, b) => {
    const aa = isPartnerActive(a) ? 1 : 0;
    const ba = isPartnerActive(b) ? 1 : 0;
    if (ba !== aa) {
      return ba - aa;
    }
    const ap = isPremiumPartner(a) ? 1 : 0;
    const bp = isPremiumPartner(b) ? 1 : 0;
    if (bp !== ap) {
      return bp - ap;
    }
    return comparePartnerNames(a, b);
  });
}
