/**
 * Page titles for the admin shell top bar (i18n path keys).
 * @param {string} pathname
 * @returns {{ path: string }}
 */
export function getAdminPageTitle(pathname) {
  const p = pathname.split('?')[0] || '';
  if (p === '/admin' || p === '/admin/') {
    return { path: 'nav.adminDashboard' };
  }
  if (p.startsWith('/admin/partners/create')) {
    return { path: 'adminPartners.addPartner' };
  }
  if (/^\/admin\/partners\/[^/]+$/.test(p)) {
    return { path: 'admin.edit_partner' };
  }
  if (p === '/admin/partners') {
    return { path: 'nav.partnerManagement' };
  }
  if (p === '/admin/events/create') {
    return { path: 'admin.create_event' };
  }
  if (/^\/admin\/events\/[^/]+$/.test(p)) {
    return { path: 'admin.edit_event' };
  }
  if (p === '/admin/events') {
    return { path: 'nav.events' };
  }
  if (p === '/admin/ads/create') {
    return { path: 'admin.new_ad' };
  }
  if (/^\/admin\/ads\/[^/]+$/.test(p)) {
    return { path: 'admin.edit_ad' };
  }
  if (p === '/admin/ads') {
    return { path: 'nav.ads' };
  }
  if (p.startsWith('/admin/users')) {
    return { path: 'nav.usersAndRoles' };
  }
  if (p.startsWith('/admin/feedback')) {
    return { path: 'nav.feedbackSupport' };
  }
  if (p.startsWith('/admin/settings')) {
    return { path: 'nav.adminSystemSettings' };
  }
  return { path: 'admin.admin' };
}
