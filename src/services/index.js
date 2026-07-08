// Config
export { config } from './config.js';

// Auth
export {
  logout,
  refreshToken,
  refreshTokens,
  ensureAccessToken,
  getAccessToken,
  getUserIdFromToken,
  getRolesFromAccessToken,
  getPlatformAuthFromToken,
  PLATFORM_ADMIN_ROLE,
  PLATFORM_SUPPORT_ROLE,
  getUserInfoFromIdentity,
  resolveHasPasswordFromUserInfo,
  getDisplayNameFromUserInfo,
  getDisplayNameFromAccessToken,
  getDisplayNameForSession,
  getHandleFromUserInfo,
  getEmailFromUserInfo,
  getEmailFromAccessToken,
  getSubFromAccessToken,
  resolveVdpConnectUserId,
  loginWithExternalProvider,
  loginWithPassword,
  handleCallback,
} from './auth/authService.js';
export {
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
  getSession,
  setSession,
  clearSession,
  clearAuth,
} from './auth/storage.js';
export {
  setOnIdleLogout,
  touchSession,
  startSessionIdleCheck,
  stopSessionIdleCheck,
  hasSession,
} from './auth/sessionService.js';

// API client
export { apiRequest, apiGet, apiPost } from './api/client.js';

// Trending
export { getTrendingHashtags } from './trendingService.js';

// Follows (followers, following lists)
export { getFollowers, getFollowing, followUser, unfollowUser } from './followService.js';

// Users (search, suggested)
export { searchUsers, getSuggestedPeople } from './suggestedPeopleService.js';

// Connections (mutual connect)
export { getMyConnections } from './connectionService.js';

// Profile (views, who viewed)
export { recordProfileView, getProfileViewers } from './profileService.js';

// Messages
export { sendMessage } from './messageService.js';
