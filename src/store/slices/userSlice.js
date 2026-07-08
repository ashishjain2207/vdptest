import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '@/services/api/client';
import { ensureProfile } from '@/services/profileService';
import { API_BASE, DEFAULT_AVATAR } from '@/lib/config';
import { setHomeCountryCode } from '@/lib/activeCountry.js';
import { getAccessToken, resolveVdpConnectUserId } from '@/services/auth/authService.js';

// Async thunk to fetch user profile by userId
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    if (!userId) {
      return rejectWithValue('No userId provided');
    }

    try {
      const apiUrl = `${API_BASE}/api/Users/${encodeURIComponent(userId)}`;
      
      const response = await apiRequest(
        apiUrl,
        { method: 'GET' },
        false,
        false,
      );

      if (response.status === 404) {
        return {
          /** True when VdpConnect has no UserProfiles row yet; callers must run ensure-profile to create one. */
          profileMissing: true,
          userId: userId,
          loggedIn: true,
          displayName: null,
          handle: null,
          profileSlug: null,
          avatarUrl: DEFAULT_AVATAR,
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return rejectWithValue(`Failed to fetch user profile: ${response.status} - ${errorText}`);
      }

      const profile = await response.json();

      // Map API response to user object format
      // Extract handle - ensure it's a string, not null/undefined
      const handle = (profile.handle && typeof profile.handle === 'string' && profile.handle.trim()) 
        ? profile.handle.trim() 
        : null;
      const profileSlug = (profile.profileSlug && typeof profile.profileSlug === 'string' && profile.profileSlug.trim())
        ? profile.profileSlug.trim()
        : handle;

      const tok = getAccessToken();
      const selfSub = tok ? resolveVdpConnectUserId(tok, null) : null;
      const sameSubject =
        selfSub &&
        userId &&
        String(selfSub).toLowerCase() === String(userId).toLowerCase();
      if (sameSubject) {
        setHomeCountryCode(profile.homeCountryCode ?? profile.HomeCountryCode ?? null);
      }

      const userProfile = {
        loggedIn: true,
        userId: profile.userId ?? profile.UserId ?? userId,
        displayName: profile.displayName || handle || 'User',
        handle: handle,
        profileSlug: profileSlug,
        avatarUrl: profile.avatarUrl || DEFAULT_AVATAR,
        bio: profile.bio,
        role: profile.role,
        company: profile.company,
        location: profile.location,
        followers: profile.followersCount ?? 0,
        following: profile.followingCount ?? 0,
        followersCount: profile.followersCount ?? 0,
        followingCount: profile.followingCount ?? 0,
        isVerified: profile.isVerified,
        postsCount: profile.postsCount ?? 0,
        linkedInProfileUrl: profile.linkedInProfileUrl,
        skills: profile.skills,
        contactEmail: profile.contactEmail,
        description: profile.description,
        experience: profile.experience,
        createdAt: profile.createdAt,
        homeCountryCode: profile.homeCountryCode ?? profile.HomeCountryCode ?? null,
      };
      
      return userProfile;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  },
);

/**
 * Ensures the current user has a VdpConnect profile (creates minimal if missing), then fetches it.
 * Call when fetchUserProfile returns 404 so follow/connect/notifications work immediately after login.
 */
export const ensureProfileAndFetch = createAsyncThunk(
  'user/ensureProfileAndFetch',
  async ({ userId, displayName, handle, email, reason, homeCountryCode, usePendingHomeCountry }, { dispatch, rejectWithValue }) => {
    const ok = await ensureProfile({
      displayName: displayName || undefined,
      handle: handle || undefined,
      email: email || undefined,
      reason,
      homeCountryCode,
      usePendingHomeCountry,
    });
    if (!ok) {
      return rejectWithValue('Failed to ensure profile');
    }
    const result = await dispatch(fetchUserProfile(userId));
    if (fetchUserProfile.fulfilled.match(result)) {
      return result.payload;
    }
    return rejectWithValue(result.error?.message || 'Failed to fetch profile after ensure');
  },
);

// Async thunk to initialize user from token
export const initializeUserFromToken = createAsyncThunk(
  'user/initializeUserFromToken',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      // Import services dynamically to avoid circular dependencies
      const { getUserInfoFromIdentity } = await import('@/services');
      const token = getAccessToken();

      if (!token) {
        return rejectWithValue('No access token found');
      }

      // Call identity API to get user object
      const userInfo = await getUserInfoFromIdentity(token);
      
      if (!userInfo) {
        return rejectWithValue('Failed to get user info from identity API');
      }

      // Extract userId from userinfo response (it's in the 'sub' field)
      const userId = userInfo.sub;

      if (!userId) {
        return rejectWithValue('No userId found in user info response');
      }

      // Check if we already have this user's profile loaded with the same userId
      const state = getState();
      if (state.user.user && state.user.user.userId === userId) {
        // Return existing user even if handle is missing - we'll still show the profile
        return state.user.user;
      }

      // Always fetch user profile from API using userId
      const result = await dispatch(fetchUserProfile(userId));

      if (fetchUserProfile.fulfilled.match(result) && result.payload?.profileMissing === true) {
        const ensured = await dispatch(
          ensureProfileAndFetch({
            userId,
            displayName: undefined,
            handle: undefined,
            email: undefined,
          }),
        );
        if (ensureProfileAndFetch.fulfilled.match(ensured)) {
          return ensured.payload;
        }
        return rejectWithValue(ensured.error?.message || 'Failed to ensure profile after missing row');
      }

      if (fetchUserProfile.fulfilled.match(result)) {
        return result.payload;
      }

      return rejectWithValue(result.error.message || 'Failed to fetch user profile');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to initialize user');
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    userId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.userId = action.payload?.userId || null;
    },
    clearUser: (state) => {
      state.user = null;
      state.userId = null;
      state.error = null;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserProfile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        // When profile is 404, payload.displayName is null – keep existing displayName from Identity so sidebar/form stay correct
        const displayName = (payload.displayName && String(payload.displayName).trim())
          ? payload.displayName
          : (state.user?.displayName || payload.displayName || 'User');
        state.user = { ...payload, displayName };
        state.userId = payload.userId;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user profile';
      })
      // initializeUserFromToken
      .addCase(initializeUserFromToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeUserFromToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.userId = action.payload.userId;
        state.error = null;
      })
      .addCase(initializeUserFromToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to initialize user';
        // Set minimal user state if token exists but profile fetch failed
        state.user = { loggedIn: true };
      })
      // ensureProfileAndFetch
      .addCase(ensureProfileAndFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ensureProfileAndFetch.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        const displayName = (payload.displayName && String(payload.displayName).trim())
          ? payload.displayName
          : (state.user?.displayName || payload.displayName || 'User');
        state.user = { ...payload, displayName };
        state.userId = payload.userId;
        state.error = null;
      })
      .addCase(ensureProfileAndFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to ensure profile';
      });
  },
});

export const { setUser, clearUser, setUserId } = userSlice.actions;
export default userSlice.reducer;
