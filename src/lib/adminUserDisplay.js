/** @param {unknown} raw @returns {'Active' | 'Suspended' | 'Pending'} */
export function normalizeAdminUserStatus(raw) {
  if (raw === 1 || raw === 'Suspended' || raw === 'suspended') {
    return 'Suspended';
  }
  if (raw === 2 || raw === 'Pending' || raw === 'pending') {
    return 'Pending';
  }
  return 'Active';
}

const DEPRECATED_PLATFORM_ROLES = new Set(['vdpconnect.moderator', 'vdpconnect.contentcreator']);

/** @param {string} roleName @param {'EN' | 'DE'} language */
export function platformRoleLabel(roleName, language) {
  let r = String(roleName ?? '').trim();
  if (DEPRECATED_PLATFORM_ROLES.has(r.toLowerCase())) {
    r = 'VdpConnect.Member';
  }
  if (language === 'DE') {
    if (r === 'VdpConnect.Admin') {return 'Plattform-Admin';}
    if (r === 'VdpConnect.Support') {return 'Unterstützung';}
    if (r === 'VdpConnect.Member') {return 'Mitglied';}
  } else {
    if (r === 'VdpConnect.Admin') {return 'Platform admin';}
    if (r === 'VdpConnect.Support') {return 'Support';}
    if (r === 'VdpConnect.Member') {return 'Member';}
  }
  return r || '—';
}
