/**
 * Maps API partner rows to Explore org card / sidebar shape.
 * @param {Record<string, unknown>} partner
 */
export function resolvePartnerMembersCount(partner, fallback = 0) {
  const p = partner ?? {};
  if (typeof p.membersCount === 'number') {
    return p.membersCount;
  }
  if (typeof p.MembersCount === 'number') {
    return p.MembersCount;
  }
  if (typeof p.followersCount === 'number') {
    return p.followersCount;
  }
  if (typeof p.FollowersCount === 'number') {
    return p.FollowersCount;
  }
  return fallback;
}

/** @param {Record<string, unknown> | null | undefined} partner @param {number} delta */
export function adjustPartnerMembersCount(partner, delta) {
  if (!partner || !delta) {
    return partner;
  }
  const next = Math.max(0, resolvePartnerMembersCount(partner, 0) + delta);
  return {
    ...partner,
    membersCount: next,
    MembersCount: next,
  };
}

/**
 * Maps API partner rows to Explore org card / sidebar shape.
 * @param {Record<string, unknown>} partner
 */
export function mapPartnerToExploreOrg(partner) {
  const p = partner ?? {};
  const membersCount = resolvePartnerMembersCount(p, 0);

  return {
    id: String(p.id ?? p.Id ?? ''),
    handle: String(p.handle ?? p.Handle ?? ''),
    name: String(p.name ?? p.Name ?? ''),
    logo: String(p.logoUrl ?? p.LogoUrl ?? p.logo ?? ''),
    description: String(p.description ?? p.Description ?? ''),
    category: String(p.category ?? p.Category ?? ''),
    location: String(p.location ?? p.Location ?? ''),
    isVerified: p.isVerified === true || p.IsVerified === true,
    isMember: p.isMember === true || p.IsMember === true,
    membersCount,
  };
}

/**
 * Client-side partner search (same fields as Partners page).
 * @param {unknown[]} partners
 * @param {string} query
 */
export function filterPartnersByQuery(partners, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) {
    return partners;
  }
  return partners.filter((row) => {
    const p = /** @type {Record<string, unknown>} */ (row ?? {});
    const name = String(p.name ?? p.Name ?? '').toLowerCase();
    const handle = String(p.handle ?? p.Handle ?? '').toLowerCase();
    const desc = String(p.description ?? p.Description ?? '').toLowerCase();
    const loc = String(p.location ?? p.Location ?? '').toLowerCase();
    return name.includes(q) || handle.includes(q) || desc.includes(q) || loc.includes(q);
  });
}
