/**
 * Maps API ConnectionProfileDto (suggested people, search, etc.) to UserCard format.
 * Reused by Index (home) and Explore (featured people) for consistency.
 * @param {object} c - API response item (camelCase or PascalCase)
 * @returns {object} UserCard-compatible shape
 */
export function mapSuggestedPersonToUserCard(c) {
  const userId = c.userId ?? c.UserId ?? '';
  const displayName = c.displayName ?? c.DisplayName ?? '';
  const handle = c.handle ?? c.Handle ?? '';
  const profileSlug = c.profileSlug ?? c.ProfileSlug ?? '';
  // Ensure handle for @display: use handle, or derive from profileSlug (format: handle-hashKey, e.g. rlux-a1b2c3d4)
  let derivedFromSlug = profileSlug;
  if (profileSlug && profileSlug.includes('-')) {
    const parts = profileSlug.split('-');
    if (parts.length >= 2 && parts[parts.length - 1].length === 8) {
      derivedFromSlug = parts.slice(0, -1).join('-');
    }
  }
  const handleForDisplay = handle || derivedFromSlug || (userId ? `user_${String(userId).slice(0, 8)}` : '');
  return {
    id: userId,
    userId,
    name: displayName || handleForDisplay || 'User',
    handle: handleForDisplay,
    profileSlug: profileSlug || handleForDisplay,
    avatar: c.avatarUrl ?? c.AvatarUrl ?? null,
    bio: c.bio ?? c.Bio ?? null,
    role: c.role ?? c.Role ?? null,
    company: c.company ?? c.Company ?? null,
    location: c.location ?? c.Location ?? null,
    followers: c.followersCount ?? c.FollowersCount ?? 0,
    following: c.followingCount ?? c.FollowingCount ?? 0,
    isVerified: c.isVerified ?? c.IsVerified ?? false,
    isFollowing: c.isFollowing ?? c.IsFollowing ?? false,
    suggestionReason: c.suggestionReason ?? c.SuggestionReason ?? null,
    mutualConnectionsCount: c.mutualConnectionsCount ?? c.MutualConnectionsCount ?? 0,
  };
}
