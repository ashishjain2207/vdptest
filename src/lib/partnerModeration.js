/** @param {unknown} role */
export function partnerRoleAtLeastModerator(role) {
  const r = String(role ?? '').trim().toLowerCase();
  return r === 'moderator' || r === 'admin';
}

/**
 * Resolve whether the viewer can moderate-delete a partner post (supplements API flag on org feeds).
 * @param {Record<string, unknown>} post
 * @param {{ viewerUserId?: string, viewerPartnerRole?: string, partnerOrganizationId?: string }} [context]
 */
export function resolveCanModeratePartnerPost(post, context = {}) {
  const apiFlag = post?.canModeratePartnerPost ?? post?.CanModeratePartnerPost;
  if (apiFlag === true) {
    return true;
  }
  if (apiFlag === false) {
    return false;
  }

  const { viewerUserId, viewerPartnerRole, partnerOrganizationId } = context;
  if (!viewerUserId || !partnerOrganizationId || !partnerRoleAtLeastModerator(viewerPartnerRole)) {
    return false;
  }

  const postOrgId = post?.organizationId ?? post?.OrganizationId;
  if (
    postOrgId
    && String(postOrgId).toLowerCase() !== String(partnerOrganizationId).toLowerCase()
  ) {
    return false;
  }

  const authorId = post?.authorId ?? post?.author?.id ?? '';
  if (
    authorId
    && String(authorId).toLowerCase() === String(viewerUserId).toLowerCase()
  ) {
    return false;
  }

  // Org feed context: API should set the flag; allow menu when viewer is mod/admin on another member's post.
  return true;
}
