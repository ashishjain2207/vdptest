import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { parseUtcIso } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/post/PostCard';
import { EditPostModal } from '@/components/post/EditPostModal';
import { UserCard } from '@/components/user/UserCard';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@imriva/framework';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  BadgeCheck, 
  MapPin, 
  Building,
  Calendar,
  Link as LinkIcon,
  MoreHorizontal,
  UserPlus,
  MessageCircle,
  Users,
  Image as ImageIcon,
  Music,
  FileText,
  Mail,
  ExternalLink,
  Globe2,
  Plus,
  X,
  Settings,
  Repeat2,
  Copy,
  Share2,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/config';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FramedImage } from '@/components/media/FramedImage';
import { normalizeImageDisplayFromApi } from '@/lib/imageCropMetadata';
import { COVER_BANNER_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { apiGet, apiPost, apiDelete } from '@/services/api/client';
import { getPostsByUser, getRepostsByUser, getPostById, getUserPostsMedia } from '@/services/postService';
import { getFollowers, getFollowing } from '@/services/followService';
import { recordProfileView, getProfileViewers } from '@/services/profileService';
import { mapApiPostToFeedPost, mapApiPollToFeedPoll, prependUniqueFeedPost } from '@/lib/postMappers';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, useTParams } from '@/i18n';
import { jobTitleLabel, locationLabel } from '@/lib/displayLabels';
import { LangText } from '@/components/ui/LangText';
import { ReportContentDialog } from '@/components/moderation/ReportContentDialog';
import { FEED_EVENTS } from '@/lib/feedEvents';
import {
  CONNECTION_EVENTS,
  normalizeConnectionUserId,
} from '@/lib/connectionEvents';
import {
  engagementDetailHasMergeableFields,
  mergeFeedPostFromEngagementDetail,
  syncOwnProfileRepostsFromEngagement,
} from '@/lib/postEngagementMerge';
import { messagesPath, postMediaPath, profilePath } from '@/lib/appRoutes';
import { getMarketCountryLabel } from '@/lib/marketCountryCodes.js';

const profileUserIdsMatch = (a, b) => {
  if (!a || !b) { return false; }
  return normalizeConnectionUserId(a) === normalizeConnectionUserId(b);
};

const Profile = () => {
  const { userId: profileKey } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = useT();
  const tParams = useTParams();
  const { user: currentUser } = useAuth();
  const { contentReportsEnabled } = useFeatureFlags();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPendingConnectionRequest, setHasPendingConnectionRequest] = useState(false);
  const [hasConnectionRequestFromThem, setHasConnectionRequestFromThem] = useState(false);
  const [pendingConnectionRequestId, setPendingConnectionRequestId] = useState(null);
  const [apiProfile, setApiProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  // Connections state
  const [connectionsTotalCount, setConnectionsTotalCount] = useState(0);

  // Loading states for follow/connect actions
  const [followLoading, setFollowLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // User posts from API
  const [userPosts, setUserPosts] = useState([]);
  const [userPostsLoading, setUserPostsLoading] = useState(false);
  const [userPostsRefetchError, setUserPostsRefetchError] = useState(null);
  // User reposts from API
  const [userReposts, setUserReposts] = useState([]);
  const [userRepostsLoading, setUserRepostsLoading] = useState(false);
  const [userRepostsRefetchError, setUserRepostsRefetchError] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Followers/Following list modal state
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalType, setListModalType] = useState('followers'); // 'followers' | 'following' | 'connections' | 'profileViews'
  const [listData, setListData] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [listTotalCount, setListTotalCount] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(0);
  const listScrollRef = useRef(null);
  const listSentinelRef = useRef(null);

  const [activeTab, setActiveTab] = useState('posts');

  // Sync active tab with URL ?tab= (e.g. when returning from media viewer)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'media' || tab === 'posts' || tab === 'reposts' || tab === 'about') {
      setActiveTab(tab);
    } else if (tab === 'connections') {
      setActiveTab('posts');
    }
  }, [searchParams]);

  useEffect(() => {
    setListModalOpen(false);
  }, [profileKey]);

  // User media from API (for Media tab) – from API/DB
  const [userMedia, setUserMedia] = useState({ images: [], videos: [], audio: [] });
  const [userMediaLoading, setUserMediaLoading] = useState(false);

  // loadMoreList and infinite scroll - must be before early returns (Rules of Hooks)
  const loadMoreList = useCallback(async () => {
    const userId = apiProfile?.userId;
    if (!userId || listLoading || listPage >= listTotalPages) {return;}
    if (listModalType === 'profileViews') {return;}
    setListLoading(true);
    try {
      if (listModalType === 'connections') {
        const res = await apiGet(`${API_BASE}/api/connections/${encodeURIComponent(userId)}?page=${listPage + 1}&pageSize=8`, { showLoader: false });
        if (!res.ok) {throw new Error('Failed to load connections');}
        const data = await res.json();
        const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : []);
        const mappedConnections = items.map((c) => ({
          id: c.userId,
          userId: c.userId,
          name: c.displayName || c.handle,
          handle: c.handle,
          profileSlug: c.profileSlug,
          avatar: c.avatarUrl || null,
          bio: c.bio,
          role: c.role,
          company: c.company,
          location: c.location,
          followers: c.followersCount ?? 0,
          following: c.followingCount ?? 0,
          isVerified: c.isVerified,
          isFollowing: c.isFollowing ?? false,
          connectedAt: c.connectedAt,
        }));
        setListData((prev) => [...prev, ...mappedConnections]);
        setListPage(data?.page ?? (listPage + 1));
        setListTotalCount(data?.totalCount ?? 0);
        setListTotalPages(data?.totalPages ?? 0);
      } else {
        const fn = listModalType === 'followers' ? getFollowers : getFollowing;
        const res = await fn(userId, listPage + 1, 50);
        setListData((prev) => [...prev, ...(res.data ?? [])]);
        setListPage((p) => p + 1);
      }
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setListLoading(false);
    }
  }, [apiProfile?.userId, listLoading, listPage, listTotalPages, listModalType]);

  useEffect(() => {
    if (!listModalOpen || listModalType === 'profileViews') {return;}
    let io;
    const id = setTimeout(() => {
      const sentinel = listSentinelRef.current;
      const scrollEl = listScrollRef.current;
      if (!sentinel || !scrollEl) {return;}
      io = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (!entry?.isIntersecting) {return;}
          loadMoreList();
        },
        { root: scrollEl, rootMargin: '100px', threshold: 0.1 },
      );
      io.observe(sentinel);
    }, 50);
    return () => {
      clearTimeout(id);
      io?.disconnect();
    };
  }, [listModalOpen, listModalType, listData.length, loadMoreList]);

  // Accept handle-only (e.g. rlux), full slug {handle}-{8hex} (e.g. vdpconnect-demo-ac5bafa6), or userId (GUID).
  const isUserIdFormat = profileKey && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(profileKey);
  const isSlugFormat = profileKey && !isUserIdFormat && /^[a-zA-Z0-9_-]+-[a-fA-F0-9]{8}$/.test(profileKey);
  const hasValidFormat = profileKey && (isUserIdFormat || /^[a-zA-Z0-9_-]+$/.test(profileKey));

  // Fetch profile: use userId endpoint for GUID, slug for handle-8hex, handle for handle-only.
  // Uses authenticated API client to get isFollowing/isConnected state for current user.
  useEffect(() => {
    if (!profileKey) {
      setLoading(false);
      return;
    }
    if (!hasValidFormat) {
      setFetchError('Invalid profile URL');
      setApiProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    const url = isUserIdFormat
      ? `${API_BASE}/api/Users/${encodeURIComponent(profileKey)}`
      : isSlugFormat
        ? `${API_BASE}/api/Users/profile/${encodeURIComponent(profileKey)}`
        : `${API_BASE}/api/Users/handle/${encodeURIComponent(profileKey)}`;
    apiGet(url)
      .then((res) => {
        if (!res.ok) {throw new Error(res.status === 404 ? 'Profile not found' : 'Failed to load profile');}
        return res.json();
      })
      .then((data) => {
        // When URL was full slug (not userId), require canonical slug match. When handle-only or userId, accept any profile returned.
        if (isSlugFormat && !isUserIdFormat) {
          const canonicalSlug = (data.profileSlug ?? '').toLowerCase();
          const urlSlug = (profileKey ?? '').toLowerCase();
          if (!canonicalSlug || canonicalSlug !== urlSlug) {
            setFetchError('Profile not found');
            setApiProfile(null);
            return;
          }
        }
        setApiProfile(data);
        setIsFollowing(data.isFollowing ?? false);
        setIsConnected(data.isConnected ?? false);
        setHasPendingConnectionRequest(data.hasPendingConnectionRequest ?? false);
        setHasConnectionRequestFromThem(data.hasConnectionRequestFromThem ?? false);
        setPendingConnectionRequestId(data.pendingConnectionRequestId ?? null);
        // Record profile view when viewing someone else's profile (fire-and-forget)
        const viewerId = currentUser?.userId ?? currentUser?.id;
        if (viewerId && data.userId && viewerId !== data.userId) {
          recordProfileView(data.userId).catch(() => {});
        }
      })
      .catch((err) => {
        setFetchError(err.message);
        setApiProfile(null);
      })
      .finally(() => setLoading(false));
  }, [profileKey, isSlugFormat, isUserIdFormat, hasValidFormat, currentUser?.userId, currentUser?.id]);

  // Fetch user posts when we have apiProfile
  useEffect(() => {
    const userId = apiProfile?.userId;
    if (!userId) {
      setUserPosts([]);
      setUserPostsRefetchError(null);
      return;
    }
    let cancelled = false;
    setUserPostsRefetchError(null);
    setUserPostsLoading(true);
    getPostsByUser(userId, 1, 50, { showLoader: false })
      .then((data) => {
        if (cancelled) {return;}
        const raw = data?.data ?? data?.items ?? data;
        const items = Array.isArray(raw) ? raw : [];
        const mapped = items.map((p) => mapApiPostToFeedPost(p));
        setUserPosts(mapped);
      })
      .catch(() => {
        if (!cancelled) {setUserPosts([]);}
      })
      .finally(() => {
        if (!cancelled) {setUserPostsLoading(false);}
      });
    return () => { cancelled = true; };
  }, [apiProfile?.userId]);

  const refetchUserPosts = () => {
    const userId = apiProfile?.userId;
    if (!userId) {return;}
    setUserPostsRefetchError(null);
    getPostsByUser(userId, 1, 50, { showLoader: false })
      .then((data) => {
        const raw = data?.data ?? data?.items ?? data;
        const items = Array.isArray(raw) ? raw : [];
        setUserPosts(items.map((p) => mapApiPostToFeedPost(p)));
        setUserPostsRefetchError(null);
      })
      .catch(() => {
        setUserPostsRefetchError(true);
        // Keep existing userPosts so a transient failure doesn't blank the tab
      });
  };

  // Fetch user reposts when we have apiProfile
  useEffect(() => {
    const userId = apiProfile?.userId;
    if (!userId) {
      setUserReposts([]);
      setUserRepostsRefetchError(null);
      return;
    }
    let cancelled = false;
    setUserRepostsRefetchError(null);
    setUserRepostsLoading(true);
    getRepostsByUser(userId, 1, 50, { showLoader: false })
      .then((data) => {
        if (cancelled) {return;}
        const raw = data?.data ?? data?.items ?? data;
        const items = Array.isArray(raw) ? raw : [];
        const mapped = items.map((p) => mapApiPostToFeedPost(p));
        setUserReposts(mapped);
      })
      .catch(() => {
        if (!cancelled) {setUserReposts([]);}
      })
      .finally(() => {
        if (!cancelled) {setUserRepostsLoading(false);}
      });
    return () => { cancelled = true; };
  }, [apiProfile?.userId]);

  const refetchUserReposts = () => {
    const userId = apiProfile?.userId;
    if (!userId) {return;}
    setUserRepostsRefetchError(null);
    getRepostsByUser(userId, 1, 50, { showLoader: false })
      .then((data) => {
        const raw = data?.data ?? data?.items ?? data;
        const items = Array.isArray(raw) ? raw : [];
        setUserReposts(items.map((p) => mapApiPostToFeedPost(p)));
        setUserRepostsRefetchError(null);
      })
      .catch(() => {
        setUserRepostsRefetchError(true);
      });
  };

  // Fetch user media from API/DB for Media tab
  useEffect(() => {
    const userId = apiProfile?.userId;
    if (!userId) {
      setUserMedia({ images: [], videos: [], audio: [] });
      return;
    }
    let cancelled = false;
    setUserMediaLoading(true);
    getUserPostsMedia(userId)
      .then((data) => {
        if (cancelled) {return;}
        setUserMedia({
          images: Array.isArray(data?.images) ? data.images : [],
          videos: Array.isArray(data?.videos) ? data.videos : [],
          audio: Array.isArray(data?.audio) ? data.audio : [],
        });
      })
      .catch(() => {
        if (!cancelled) {setUserMedia({ images: [], videos: [], audio: [] });}
      })
      .finally(() => {
        if (!cancelled) {setUserMediaLoading(false);}
      });
    return () => { cancelled = true; };
  }, [apiProfile?.userId]);

  const mergePostEngagement = useCallback((postId, detail) => {
    if (!postId) {return;}
    if (engagementDetailHasMergeableFields(detail)) {
      const norm = (x) => String(x ?? '').toLowerCase();
      const samplePost =
        userPosts.find((p) => norm(p.id) === norm(postId)) ??
        userReposts.find((p) => norm(p.id) === norm(postId));
      const preview = samplePost
        ? mergeFeedPostFromEngagementDetail(samplePost, { ...detail, postId }, currentUser?.userId)
        : null;
      if (preview) {
        const mergeList = (setter) => {
          setter((prev) =>
            prev.map((p) => {
              if (norm(p.id) !== norm(postId)) {return p;}
              const merged = mergeFeedPostFromEngagementDetail(p, { ...detail, postId }, currentUser?.userId);
              return merged ?? p;
            }),
          );
        };
        mergeList(setUserPosts);
        mergeList(setUserReposts);
        return;
      }
    }
    getPostById(postId)
      .then((fetchedPost) => {
        if (!fetchedPost) {return;}
        const mapped = mapApiPostToFeedPost(fetchedPost);
        const norm = (x) => String(x ?? '').toLowerCase();
        const replaceInPlace = (prev) => prev.map((p) => (norm(p.id) === norm(postId) ? mapped : p));
        setUserPosts(replaceInPlace);
        setUserReposts(replaceInPlace);
      })
      .catch(() => {});
  }, [currentUser?.userId, userPosts, userReposts]);

  const isOwnProfileRef = useRef(false);
  const refetchRef = useRef({ refetchUserPosts, refetchUserReposts, mergePostEngagement });
  isOwnProfileRef.current = profileUserIdsMatch(apiProfile?.userId, currentUser?.userId);

  const handlePostUpdated = (updatedApiPost) => {
    if (!updatedApiPost) {return;}
    const mapped = mapApiPostToFeedPost(updatedApiPost);
    const norm = (x) => String(x ?? '').toLowerCase();
    setUserPosts((prev) => prev.map((p) => (norm(p.id) === norm(mapped.id) ? mapped : p)));
    setEditingPost(null);
  };

  const handlePollVoted = (postId, apiPoll) => {
    const mappedPoll = mapApiPollToFeedPoll(apiPoll);
    if (!mappedPoll) {return;}
    const norm = (x) => String(x ?? '').toLowerCase();
    setUserPosts((prev) =>
      prev.map((p) =>
        norm(p.id) === norm(postId) ? { ...p, poll: mappedPoll } : p,
      ),
    );
    setUserReposts((prev) =>
      prev.map((p) =>
        norm(p.id) === norm(postId) ? { ...p, poll: mappedPoll } : p,
      ),
    );
  };

  // Fetch connections from API (authenticated to get isFollowing state)
  const fetchConnections = async (userId, page = 1) => {
    if (!userId) {return;}
    try {
      const res = await apiGet(`${API_BASE}/api/connections/${encodeURIComponent(userId)}?page=${page}&pageSize=8`, { showLoader: false });
      if (!res.ok) {throw new Error('Failed to load connections');}
      const data = await res.json();
      setConnectionsTotalCount(data?.totalCount ?? 0);
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  };

  // Load connections when profile is loaded
  useEffect(() => {
    if (apiProfile?.userId) {
      fetchConnections(apiProfile.userId, 1, false);
    }
  }, [apiProfile?.userId]);

  // Refetch profile to get updated counts (posts, followers, etc.)
  const refetchProfile = useCallback(async () => {
    if (!profileKey || !hasValidFormat) {return;}
    const url = isUserIdFormat
      ? `${API_BASE}/api/Users/${encodeURIComponent(profileKey)}`
      : isSlugFormat
        ? `${API_BASE}/api/Users/profile/${encodeURIComponent(profileKey)}`
        : `${API_BASE}/api/Users/handle/${encodeURIComponent(profileKey)}`;
    try {
      const res = await apiGet(url, { showLoader: false });
      if (res.ok) {
        const data = await res.json();
        setApiProfile(data);
        setIsFollowing(data.isFollowing ?? false);
        setIsConnected(data.isConnected ?? false);
        setHasPendingConnectionRequest(data.hasPendingConnectionRequest ?? false);
        setHasConnectionRequestFromThem(data.hasConnectionRequestFromThem ?? false);
        setPendingConnectionRequestId(data.pendingConnectionRequestId ?? null);
      }
    } catch (err) {
      console.error('Refetch profile error:', err);
    }
  }, [profileKey, hasValidFormat, isUserIdFormat, isSlugFormat]);

  refetchRef.current = {
    refetchUserPosts,
    refetchUserReposts,
    mergePostEngagement,
    refetchProfile,
    fetchConnections,
    authUserId: currentUser?.userId,
    profileUserId: apiProfile?.userId,
  };

  useEffect(() => {
    const onRelationshipChanged = (e) => {
      const detail = e.detail;
      if (!detail) {
        return;
      }
      const profileUserId = refetchRef.current.profileUserId;
      if (!profileUserId) {
        return;
      }
      const peerId = detail.peerUserId ?? detail.actorUserId;
      if (!peerId || normalizeConnectionUserId(peerId) !== normalizeConnectionUserId(profileUserId)) {
        return;
      }
      if (typeof detail.isConnected === 'boolean') {
        setIsConnected(detail.isConnected);
      }
      if (typeof detail.hasPendingConnectionRequest === 'boolean') {
        setHasPendingConnectionRequest(detail.hasPendingConnectionRequest);
      }
      if (typeof detail.hasConnectionRequestFromThem === 'boolean') {
        setHasConnectionRequestFromThem(detail.hasConnectionRequestFromThem);
      }
      if ('pendingConnectionRequestId' in detail) {
        setPendingConnectionRequestId(detail.pendingConnectionRequestId ?? null);
      }
      if (detail.notificationType === 'connectionAccepted') {
        setIsConnected(true);
        setHasPendingConnectionRequest(false);
        setHasConnectionRequestFromThem(false);
        setPendingConnectionRequestId(null);
      }
      void refetchRef.current.refetchProfile?.();
      void refetchRef.current.fetchConnections?.(profileUserId, 1);
    };
    window.addEventListener(CONNECTION_EVENTS.RELATIONSHIP_CHANGED, onRelationshipChanged);
    return () => window.removeEventListener(CONNECTION_EVENTS.RELATIONSHIP_CHANGED, onRelationshipChanged);
  }, []);

  useEffect(() => {
    const onFeedChange = (e) => {
      const profileUserId = refetchRef.current.profileUserId;
      if (!profileUserId) { return; }

      refetchRef.current.refetchProfile?.();

      const createdPost = e?.detail?.post;
      if (e?.type === FEED_EVENTS.POST_CREATED && createdPost) {
        const authorId = createdPost.authorId ?? createdPost.AuthorId;
        if (authorId && !profileUserIdsMatch(authorId, profileUserId)) {
          return;
        }
        const mapped = mapApiPostToFeedPost(createdPost, {
          useCurrentUserAsAuthor: profileUserIdsMatch(refetchRef.current.authUserId, profileUserId),
          currentUser: currentUser
            ? { name: currentUser.displayName, handle: currentUser.handle, isVerified: currentUser.isVerified }
            : undefined,
        });
        setUserPosts((prev) => prependUniqueFeedPost(prev, mapped));
        setApiProfile((prev) =>
          prev ? { ...prev, postsCount: (prev.postsCount ?? 0) + 1 } : prev,
        );
        return;
      }

      refetchRef.current.refetchUserPosts?.();
      if (profileUserIdsMatch(refetchRef.current.authUserId, profileUserId)) {
        refetchRef.current.refetchUserReposts?.();
      }
    };
    const onEngagementChange = (e) => {
      if (e.detail?.refetchFeed) {
        refetchRef.current.refetchUserPosts?.();
        refetchRef.current.refetchUserReposts?.();
        return;
      }
      void syncOwnProfileRepostsFromEngagement({
        detail: e.detail,
        authUserId: refetchRef.current.authUserId,
        profileUserId: refetchRef.current.profileUserId,
        setUserReposts,
        getPostById,
        mapApiPostToFeedPost,
      });
      const postId = e.detail?.postId;
      if (postId) {
        refetchRef.current.mergePostEngagement?.(postId, e.detail);
      } else {
        refetchRef.current.refetchUserPosts?.();
        refetchRef.current.refetchUserReposts?.();
      }
    };
    window.addEventListener(FEED_EVENTS.POST_CREATED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_UPDATED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
    window.addEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagementChange);
    return () => {
      window.removeEventListener(FEED_EVENTS.POST_CREATED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_UPDATED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_DELETED, onFeedChange);
      window.removeEventListener(FEED_EVENTS.POST_ENGAGEMENT_UPDATED, onEngagementChange);
    };
  }, [currentUser]);

  const handleOwnPostDeleted = useCallback((postId) => {
    const norm = (x) => String(x ?? '').toLowerCase();
    setUserPosts((prev) => prev.filter((p) => norm(p.id) !== norm(postId)));
    setApiProfile((prev) =>
      prev
        ? { ...prev, postsCount: Math.max(0, (prev.postsCount ?? 0) - 1) }
        : prev,
    );
    void refetchProfile();
  }, [refetchProfile]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!apiProfile?.userId || followLoading) {return;}
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await apiDelete(`${API_BASE}/api/follows/${encodeURIComponent(apiProfile.userId)}`, { showLoader: false });
        if (res.ok || res.status === 204) {
          setIsFollowing(false);
          setApiProfile(prev => prev ? { ...prev, followersCount: Math.max(0, (prev.followersCount ?? 0) - 1) } : prev);
          refetchProfile(); // Refetch to ensure count stays in sync
        }
      } else {
        const res = await apiPost(`${API_BASE}/api/follows/${encodeURIComponent(apiProfile.userId)}`, null, { showLoader: false });
        if (res.ok || res.status === 204) {
          setIsFollowing(true);
          setApiProfile(prev => prev ? { ...prev, followersCount: (prev.followersCount ?? 0) + 1 } : prev);
          refetchProfile(); // Refetch to ensure count stays in sync
        }
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle connect: send request, withdraw, or disconnect
  const handleConnectToggle = async () => {
    if (!apiProfile?.userId || connectLoading) {return;}
    setConnectLoading(true);
    try {
      if (isConnected) {
        const res = await apiDelete(`${API_BASE}/api/connections/${encodeURIComponent(apiProfile.userId)}`, { showLoader: false });
        if (res.ok || res.status === 204) {
          setIsConnected(false);
          setConnectionsTotalCount(prev => Math.max(0, prev - 1));
          refetchProfile();
          fetchConnections(apiProfile.userId, 1, false);
        }
      } else if (hasPendingConnectionRequest) {
        const res = await apiDelete(`${API_BASE}/api/connections/${encodeURIComponent(apiProfile.userId)}/request`, { showLoader: false });
        if (res.ok || res.status === 204) {
          setHasPendingConnectionRequest(false);
          refetchProfile();
        }
      } else {
        // Send connection request
        const res = await apiPost(`${API_BASE}/api/connections/${encodeURIComponent(apiProfile.userId)}`, null, { showLoader: false });
        if (res.ok || res.status === 204) {
          setHasPendingConnectionRequest(true);
          // Don't refetch here: a later refetch could complete after the user clicks Follow and overwrite isFollowing
        }
      }
    } catch (err) {
      console.error('Connect error:', err);
    } finally {
      setConnectLoading(false);
    }
  };

  // Accept connection request (they sent us a request)
  const handleAcceptConnection = async () => {
    if (!pendingConnectionRequestId || connectLoading) {return;}
    setConnectLoading(true);
    try {
      const res = await apiPost(`${API_BASE}/api/connections/requests/${pendingConnectionRequestId}/accept`, null, { showLoader: false });
      if (res.ok || res.status === 204) {
        setIsConnected(true);
        setHasPendingConnectionRequest(false);
        setHasConnectionRequestFromThem(false);
        setPendingConnectionRequestId(null);
        setConnectionsTotalCount(prev => prev + 1);
        refetchProfile();
        fetchConnections(apiProfile?.userId ?? '', 1, false);
      }
    } catch (err) {
      console.error('Accept connection error:', err);
    } finally {
      setConnectLoading(false);
    }
  };

  // Reject connection request
  const handleRejectConnection = async () => {
    if (!pendingConnectionRequestId || connectLoading) {return;}
    setConnectLoading(true);
    try {
      const res = await apiPost(`${API_BASE}/api/connections/requests/${pendingConnectionRequestId}/reject`, null, { showLoader: false });
      if (res.ok || res.status === 204) {
        setHasConnectionRequestFromThem(false);
        setPendingConnectionRequestId(null);
        refetchProfile();
      }
    } catch (err) {
      console.error('Reject connection error:', err);
    } finally {
      setConnectLoading(false);
    }
  };

  // Use only API profile; never show mock/fallback user — error states are handled below when apiProfile is missing.
  const userFromApi = apiProfile
    ? {
      id: apiProfile.userId,
      name: apiProfile.displayName || apiProfile.handle,
      handle: apiProfile.handle,
      profileSlug: apiProfile.profileSlug || apiProfile.handle,
      avatar: apiProfile.avatarUrl || null,
      bio: apiProfile.bio,
      role: apiProfile.role,
      company: apiProfile.company,
      location: apiProfile.location,
      followers: apiProfile.followersCount ?? 0,
      following: apiProfile.followingCount ?? 0,
      isVerified: apiProfile.isVerified,
      postsCount: apiProfile.postsCount ?? 0,
      profileViewsCount: apiProfile.profileViewsCount ?? 0,
      linkedInProfileUrl: apiProfile.linkedInProfileUrl,
      skills: apiProfile.skills,
      contactEmail: apiProfile.contactEmail,
      description: apiProfile.description,
      experience: apiProfile.experience,
      createdAt: apiProfile.createdAt,
      website: apiProfile.website,
      coverImageUrl: apiProfile.coverImageUrl,
      coverImageDisplay: normalizeImageDisplayFromApi(apiProfile.coverImageDisplay ?? apiProfile.CoverImageDisplay),
      avatarImageDisplay: normalizeImageDisplayFromApi(apiProfile.avatarImageDisplay ?? apiProfile.AvatarImageDisplay),
      homeCountryCode: apiProfile.homeCountryCode ?? apiProfile.HomeCountryCode ?? null,
    }
    : null;
  const user = userFromApi;

  // Show loading only when actually fetching (valid format); invalid format resolves immediately with an error state
  if (loading && (!profileKey || hasValidFormat)) {
    return (
      <MainLayout fullWidth>
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-muted-foreground"><LangText path="common.loading_profile"  /></p>
        </div>
      </MainLayout>
    );
  }

  // No API profile: distinguish wrong URL, missing profile (404), and network/API errors — avoid labeling connection issues as "Invalid user".
  if (!user) {
    const isInvalidUrl = fetchError === 'Invalid profile URL';
    const isProfileNotFound =
      fetchError === 'Profile not found' || fetchError?.toLowerCase?.().includes('profile not found');
    const isApiUnreachable = Boolean(fetchError && !isInvalidUrl && !isProfileNotFound);
    return (
      <MainLayout fullWidth>
        <div className="px-4 lg:px-6">
          <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            <LangText path="layout.back"  />
          </Button>
          <div className="bg-card rounded-xl border border-border p-6 text-center space-y-3">
            <p className="text-lg font-semibold text-foreground">
              {isInvalidUrl ? (
                <LangText path="common.invalid_profile_link"  />
              ) : isProfileNotFound ? (
                <LangText path="common.profile_not_found"  />
              ) : isApiUnreachable ? (
                <LangText path="common.unable_to_load_profile"  />
              ) : (
                <LangText path="common.profile_not_found"  />
              )}
            </p>
            {isApiUnreachable && fetchError ? (
              <p className="text-sm text-muted-foreground">{fetchError}</p>
            ) : null}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser && user && (
    currentUser.userId === user.userId ||
    currentUser.userId === user.id ||
    currentUser.handle === user.handle ||
    currentUser.profileSlug === user.profileSlug
  );

  const hasCustomAvatar = apiProfile?.avatarUrl && apiProfile.avatarUrl.trim() !== '';
  const heroSkills = Array.isArray(user.skills)
    ? user.skills.filter(Boolean)
    : typeof user.skills === 'string'
      ? user.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
      : [];
  const formatStatValue = (value) => {
    if (typeof value !== 'number') {return value;}
    if (value >= 1000) {return `${(value / 1000).toFixed(1)}K`;}
    return value;
  };
  
  // Stats from API: postsCount, followersCount, followingCount, profileViewsCount (all dynamic)
  // Only show followers/following/profile-views modal when count > 0
  const followersCount = user.followers ?? 0;
  const followingCount = user.following ?? 0;
  const profileViewsCount = user.profileViewsCount ?? 0;
  const stats = [
    { key: 'posts', labelKey: 'profile.statPosts', value: user.postsCount ?? 0, clickable: false },
    { key: 'followers', labelKey: 'profile.statFollowers', value: followersCount, clickable: followersCount > 0 },
    { key: 'following', labelKey: 'profile.statFollowing', value: followingCount, clickable: followingCount > 0 },
    { key: 'connections', labelKey: 'profile.statConnections', value: connectionsTotalCount, clickable: connectionsTotalCount > 0 },
    ...(isOwnProfile ? [{ key: 'profileViews', labelKey: 'profile.statProfileViews', value: profileViewsCount, clickable: profileViewsCount > 0 }] : []),
  ];

  const openListModal = async (type) => {
    const userId = user.userId ?? user.id ?? apiProfile?.userId;
    if (!userId) {return;}
    setListModalType(type);
    setListModalOpen(true);
    setListLoading(true);
    setListData([]);
    setListPage(1);
    try {
      if (type === 'profileViews') {
        const res = await getProfileViewers(20);
        const viewers = (res.viewers ?? []).map((v) => ({
          ...mapApiProfileToUserCard(v),
          viewedAt: v.viewedAt,
        }));
        setListData(viewers);
        setListTotalCount(res.totalCount ?? 0);
        setListTotalPages(1); // Profile viewers are not paginated in API
      } else if (type === 'connections') {
        const res = await apiGet(`${API_BASE}/api/connections/${encodeURIComponent(userId)}?page=1&pageSize=8`, { showLoader: false });
        if (!res.ok) {throw new Error('Failed to load connections');}
        const data = await res.json();
        const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : []);
        const mappedConnections = items.map((c) => ({
          id: c.userId,
          userId: c.userId,
          name: c.displayName || c.handle,
          handle: c.handle,
          profileSlug: c.profileSlug,
          avatar: c.avatarUrl || null,
          bio: c.bio,
          role: c.role,
          company: c.company,
          location: c.location,
          followers: c.followersCount ?? 0,
          following: c.followingCount ?? 0,
          isVerified: c.isVerified ?? false,
          isFollowing: c.isFollowing ?? false,
          connectedAt: c.connectedAt,
        }));
        setListData(mappedConnections);
        setListTotalCount(data?.totalCount ?? 0);
        setListTotalPages(data?.totalPages ?? 0);
      } else {
        const fn = type === 'followers' ? getFollowers : getFollowing;
        const res = await fn(userId, 1, 50);
        setListData(res.data ?? []);
        setListTotalCount(res.totalCount ?? 0);
        setListTotalPages(res.totalPages ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch list:', err);
      setListData([]);
    } finally {
      setListLoading(false);
    }
  };

  const mapApiProfileToUserCard = (p) => ({
    userId: p.userId,
    id: p.userId,
    name: p.displayName ?? p.handle,
    handle: p.handle,
    profileSlug: p.profileSlug ?? p.handle,
    avatar: p.avatarUrl,
    bio: p.bio,
    company: p.company,
    location: p.location,
    isFollowing: p.isFollowing ?? false,
    followers: p.followersCount ?? 0,
    following: p.followingCount ?? 0,
    isVerified: p.isVerified ?? false,
  });

  return (
    <MainLayout fullWidth>
      <EditPostModal
        open={Boolean(editingPost)}
        onOpenChange={(open) => !open && setEditingPost(null)}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
      <div className="w-full px-4 lg:px-6" data-testid="user-profile-page">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          <LangText path="layout.back"  />
        </Button>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm animate-fade-in">
          {/* Cover Image */}
          <div 
            className={cn(
              'relative h-36 overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-accent sm:h-44',
              user.coverImageUrl?.trim() && 'cursor-pointer group',
            )}
            onClick={() => {
              if (user.coverImageUrl?.trim()) {
                setLightboxImage(user.coverImageUrl);
                setLightboxOpen(true);
              }
            }}
          >
            {user.coverImageUrl?.trim() ? (
              <>
                <FramedImage
                  src={user.coverImageUrl}
                  imageDisplay={user.coverImageDisplay}
                  alt={t('common.cover')}
                  className="h-full w-full"
                  frameClassName="h-full w-full"
                  frameAspectRatio={COVER_BANNER_ASPECT_RATIO}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/20">
                  <ImageIcon className="h-8 w-8 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>
              </>
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/80 to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="px-4 pb-7 sm:px-8">
            {/* Avatar & Actions Row */}
            <div className="relative z-10 -mt-14 flex flex-col gap-2 sm:-mt-16">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="relative">
                  <Avatar 
                    className={cn(
                      'h-28 w-28 border-4 border-background shadow-elevated sm:h-32 sm:w-32',
                      hasCustomAvatar && 'cursor-pointer group',
                    )}
                    onClick={() => {
                      if (hasCustomAvatar) {
                        setLightboxImage(apiProfile.avatarUrl);
                        setLightboxOpen(true);
                      }
                    }}
                  >
                    {(apiProfile?.avatarUrl || user?.avatar) ? (
                      <AvatarImage src={apiProfile?.avatarUrl || user?.avatar} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-2xl font-medium">
                      {getInitials(user?.name ?? user?.displayName)}
                    </AvatarFallback>
                    {hasCustomAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
                        <ImageIcon className="h-8 w-8 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      </div>
                    )}
                  </Avatar>
                  {/* Show "+ add photo" button when viewing own profile and no custom avatar exists */}
                  {isOwnProfile && !hasCustomAvatar && (
                    <button
                      onClick={() => navigate('/settings/profile')}
                      className="absolute -bottom-0.5 -right-0.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white text-primary shadow-md transition-all hover:scale-110 hover:bg-gray-50"
                      title={t('common.add_photo')}
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="hidden flex-wrap items-center gap-2 self-end sm:self-start">
                  {/* 3 dots menu - show Edit Profile for own profile */}
                  {isOwnProfile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-border/70 bg-background/90" aria-label={t('common.profile_actions')}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                          <Settings className="w-4 h-4 mr-2" />
                          <LangText path="common.edit_profile"  />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-border/70 bg-background/90" aria-label={t('common.profile_actions')}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
                            if (!url) {
                              return;
                            }
                            navigator.clipboard.writeText(url).then(
                              () => toast.success(t('common.profile_link_copied')),
                              () => toast.error(t('common.could_not_copy')),
                            );
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          <LangText path="common.copy_profile_link"  />
                        </DropdownMenuItem>
                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                          <DropdownMenuItem
                            onClick={() => {
                              const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
                              const title = apiProfile?.displayName || apiProfile?.handle || 'Profile';
                              navigator.share({ title, url }).catch(() => {});
                            }}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            <LangText path="common.share_profile"  />
                          </DropdownMenuItem>
                        ) : null}
                        {contentReportsEnabled ? (
                          <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                            <Flag className="w-4 h-4 mr-2" />
                            <LangText path="moderation.report" />
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                
                  {/* Message, Connect, Follow - only show for other users' profiles */}
                  {!isOwnProfile && (
                    <>
                      <span
                        className="inline-flex"
                        title={
                          !isConnected
                            ? (language === 'EN'
                              ? 'Connect to start a conversation. Open existing threads from Messages.'
                              : 'Verbinden Sie sich, um zu schreiben. Bestehende Chats öffnen Sie unter Nachrichten.')
                            : undefined
                        }
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 gap-2 rounded-2xl border-border/70 bg-background/90 px-5 text-sm font-medium text-foreground"
                          disabled={!isConnected}
                          aria-disabled={!isConnected}
                          onClick={() => {
                            if (!isConnected) {
                              return;
                            }
                            navigate(messagesPath(apiProfile.userId), { state: { displayName: apiProfile.displayName, avatarUrl: apiProfile.avatarUrl, handle: apiProfile.handle, openUserId: apiProfile.userId } });
                          }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <LangText path="messages.message"  />
                        </Button>
                      </span>
                      {/* Connection request flow: Accept/Reject when they sent request, else Connect/Pending/Connected */}
                      {hasConnectionRequestFromThem ? (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="h-11 gap-2 rounded-2xl px-5"
                            onClick={handleAcceptConnection}
                            disabled={connectLoading}
                          >
                            <UserPlus className="w-4 h-4" />
                            {connectLoading ? '...' : (t('common.accept'))}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 rounded-2xl border-border/70 bg-background/90 px-5"
                            onClick={handleRejectConnection}
                            disabled={connectLoading}
                          >
                            {connectLoading ? '...' : (t('common.reject'))}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant={isConnected ? 'outline' : 'secondary'}
                          size="sm"
                          className={cn(
                            'h-11 gap-2 rounded-2xl border-border/70 bg-background/90 px-5 text-sm font-medium',
                            isConnected && 'border-success bg-success/5 text-success',
                            hasPendingConnectionRequest && 'border-muted-foreground text-muted-foreground',
                          )}
                          onClick={handleConnectToggle}
                          disabled={connectLoading}
                        >
                          <UserPlus className="w-4 h-4" />
                          {connectLoading ? '...' : isConnected ? (t('common.connected')) : hasPendingConnectionRequest ? (t('common.requested')) : (t('common.connect'))}
                        </Button>
                      )}
                      <Button
                        variant={isFollowing ? 'outline' : 'default'}
                        size="sm"
                        data-testid="profile-follow-button"
                        className={cn(
                          'h-11 rounded-2xl px-5 text-sm font-semibold',
                          isFollowing
                            ? 'border-border/70 bg-background/90 hover:border-destructive hover:bg-destructive/10 hover:text-destructive'
                            : 'border-transparent bg-primary text-primary-foreground hover:opacity-95',
                        )}
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                      >
                        {followLoading ? '...' : isFollowing ? (t('layout.following')) : (t('people.follow'))}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Name & Handle */}
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-5xl">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[2.35rem]">{user.name}</h1>
                  {user.isVerified && (
                    <BadgeCheck className="w-6 h-6 text-primary fill-primary/20" />
                  )}
                </div>
                <p className="mt-1 text-xl text-muted-foreground">@{user.handle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {isOwnProfile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-border/70 bg-background/90" aria-label={t('common.profile_actions')}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                        <Settings className="w-4 h-4 mr-2" />
                        <LangText path="common.edit_profile"  />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-border/70 bg-background/90" aria-label={t('common.profile_actions')}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
                            if (!url) {
                              return;
                            }
                            navigator.clipboard.writeText(url).then(
                              () => toast.success(t('common.profile_link_copied')),
                              () => toast.error(t('common.could_not_copy')),
                            );
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          <LangText path="common.copy_profile_link"  />
                        </DropdownMenuItem>
                        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                          <DropdownMenuItem
                            onClick={() => {
                              const url = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
                              const title = apiProfile?.displayName || apiProfile?.handle || 'Profile';
                              navigator.share({ title, url }).catch(() => {});
                            }}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            <LangText path="common.share_profile"  />
                          </DropdownMenuItem>
                        ) : null}
                        {contentReportsEnabled ? (
                          <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                            <Flag className="w-4 h-4 mr-2" />
                            <LangText path="moderation.report" />
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span
                      className="inline-flex"
                      title={
                        !isConnected
                          ? (language === 'EN'
                            ? 'Connect to start a conversation. Open existing threads from Messages.'
                            : 'Verbinden Sie sich, um zu schreiben. Bestehende Chats öffnen Sie unter Nachrichten.')
                          : undefined
                      }
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 gap-2 rounded-2xl border-border/70 bg-background/90 px-5 text-sm font-medium text-foreground"
                        disabled={!isConnected}
                        aria-disabled={!isConnected}
                        onClick={() => {
                          if (!isConnected) {
                            return;
                          }
                          navigate(messagesPath(apiProfile.userId), { state: { displayName: apiProfile.displayName, avatarUrl: apiProfile.avatarUrl, handle: apiProfile.handle, openUserId: apiProfile.userId } });
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <LangText path="messages.message"  />
                      </Button>
                    </span>
                    {hasConnectionRequestFromThem ? (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-11 gap-2 rounded-2xl px-5"
                          onClick={handleAcceptConnection}
                          disabled={connectLoading}
                        >
                          <UserPlus className="w-4 h-4" />
                          {connectLoading ? '...' : (t('common.accept'))}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 rounded-2xl border-border/70 bg-background/90 px-5"
                          onClick={handleRejectConnection}
                          disabled={connectLoading}
                        >
                          {connectLoading ? '...' : (t('common.reject'))}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant={isConnected ? 'outline' : 'secondary'}
                        size="sm"
                        className={cn(
                          'h-11 gap-2 rounded-2xl border-border/70 bg-background/90 px-5 text-sm font-medium',
                          isConnected && 'border-success bg-success/5 text-success',
                          hasPendingConnectionRequest && 'border-muted-foreground text-muted-foreground',
                        )}
                        onClick={handleConnectToggle}
                        disabled={connectLoading}
                      >
                        <UserPlus className="w-4 h-4" />
                        {connectLoading ? '...' : isConnected ? (t('common.connected')) : hasPendingConnectionRequest ? (t('common.requested')) : (t('common.connect'))}
                      </Button>
                    )}
                    <Button
                      variant={isFollowing ? 'outline' : 'default'}
                      size="sm"
                      data-testid="profile-follow-button"
                      className={cn(
                        'h-11 rounded-2xl px-5 text-sm font-semibold',
                        isFollowing
                          ? 'border-border/70 bg-background/90 hover:border-destructive hover:bg-destructive/10 hover:text-destructive'
                          : 'border-transparent bg-primary text-primary-foreground hover:opacity-95',
                      )}
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                    >
                      {followLoading ? '...' : isFollowing ? (t('layout.following')) : (t('people.follow'))}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio — only reserve space when present */}
            {user.bio ? (
              <div className="mt-5 max-w-5xl">
                <p className="text-lg leading-relaxed text-foreground/90">{user.bio}</p>
              </div>
            ) : null}

            {/* Meta — single horizontal row where space allows */}
            <div
              className={cn(
                'flex flex-row flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-muted-foreground sm:gap-x-8',
                user.bio ? 'mt-4' : 'mt-5',
              )}
            >
              {(user.role || user.company) ? (
                <div className="flex w-auto max-w-full shrink min-w-0 items-center gap-2">
                  <Building className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">
                    {user.role && user.company
                      ? tParams('profile.roleAtCompany', {
                        role: jobTitleLabel(user.role, language),
                        company: user.company,
                      })
                      : user.role
                        ? jobTitleLabel(user.role, language)
                        : user.company
                          ? <span className="font-semibold text-foreground">{user.company}</span>
                          : null}
                  </span>
                </div>
              ) : null}
              {user.location ? (
                <div className="flex w-auto max-w-full shrink min-w-0 items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">{locationLabel(user.location, language)}</span>
                </div>
              ) : null}
              <div className="flex w-auto max-w-full shrink min-w-0 items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">
                  {t('common.joined')}
                  <span className="text-foreground">
                    {user.createdAt
                      ? (() => {
                        const d = parseUtcIso(user.createdAt);
                        return d
                          ? d.toLocaleDateString(t('common.en_us'), { month: 'long', year: 'numeric' })
                          : '—';
                      })()
                      : '—'}
                  </span>
                </span>
              </div>
              {(user.linkedInProfileUrl) ? (
                <div className="flex w-auto max-w-full min-w-0 shrink items-center gap-2">
                  <LinkIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 max-w-[min(100%,28rem)] sm:max-w-none">
                    <a
                      href={user.linkedInProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline text-primary hover:underline break-all sm:break-normal"
                    >
                      {user.linkedInProfileUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap justify-start gap-x-9 gap-y-4 border-t border-border pt-6">
              {stats.map((stat) => (
                <div
                  key={stat.key}
                  className={cn(
                    'min-w-[4.5rem] text-left',
                    stat.clickable && 'cursor-pointer hover:opacity-80 transition-opacity',
                  )}
                  onClick={stat.clickable ? () => openListModal(stat.key) : undefined}
                  role={stat.clickable ? 'button' : undefined}
                  tabIndex={stat.clickable ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (stat.clickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      openListModal(stat.key);
                    }
                  }}
                >
                  <p className="text-[2rem] font-bold tabular-nums text-foreground leading-none">
                    {formatStatValue(stat.value)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </div>
            {heroSkills.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {heroSkills.slice(0, 8).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border bg-muted/35 px-4 py-2 text-sm font-medium text-foreground/85"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6" data-testid="user-profile-tabs">
          <TabsList className="w-full justify-start h-auto p-1 bg-card border border-border rounded-xl flex-wrap gap-1">
            <TabsTrigger value="posts" className="gap-2 data-[state=active]:shadow-sm flex-1">
              <FileText className="w-4 h-4" />
              <LangText path="layout.posts"  />
            </TabsTrigger>
            <TabsTrigger value="reposts" className="gap-2 data-[state=active]:shadow-sm flex-1">
              <Repeat2 className="w-4 h-4" />
              <LangText path="notifications.shared_posts"  />
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2 data-[state=active]:shadow-sm flex-1">
              <ImageIcon className="w-4 h-4" />
              <LangText path="common.media"  />
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2 data-[state=active]:shadow-sm flex-1">
              <Users className="w-4 h-4" />
              <LangText path="common.about"  />
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-6 space-y-4">
            {userPostsRefetchError && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <span>
                  {t('profile.couldntRefreshPosts')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchUserPosts}
                >
                  <LangText path="common.retry"  />
                </Button>
              </div>
            )}
            {userPostsLoading && (
              <p className="text-muted-foreground py-4"><LangText path="explore.loading_posts_2"  /></p>
            )}
            {!userPostsLoading && userPosts.length > 0 && userPosts.map((post, index) => (
              <div 
                key={post.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PostCard
                  post={post}
                  onEdit={setEditingPost}
                  onDeleted={handleOwnPostDeleted}
                  onPollVoted={handlePollVoted}
                />
              </div>
            ))}
            {!userPostsLoading && userPosts.length === 0 && (
              <p className="text-muted-foreground py-4"><LangText path="common.no_posts_yet"  /></p>
            )}
          </TabsContent>

          {/* Reposts Tab */}
          <TabsContent value="reposts" className="mt-6 space-y-4">
            {userRepostsRefetchError && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <span>
                  {t('profile.couldntRefreshReposts')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchUserReposts}
                >
                  <LangText path="common.retry"  />
                </Button>
              </div>
            )}
            {userRepostsLoading && (
              <p className="text-muted-foreground py-4"><LangText path="common.loading_reposts"  /></p>
            )}
            {!userRepostsLoading && userReposts.length > 0 && userReposts.map((post, index) => (
              <div
                key={post.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PostCard
                  post={post}
                  onDeleted={(id) => {
                    const norm = (x) => String(x ?? '').toLowerCase();
                    setUserReposts((prev) => prev.filter((p) => norm(p.id) !== norm(id)));
                  }}
                  onPollVoted={handlePollVoted}
                />
              </div>
            ))}
            {!userRepostsLoading && userReposts.length === 0 && (
              <p className="text-muted-foreground py-4">
                <LangText path="common.no_reposts_yet"  />
              </p>
            )}
          </TabsContent>

          {/* Media Tab – from API/DB (GET /api/Posts/user/{userId}/media); each tile links to /media/post/postId/order */}
          <TabsContent value="media" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {userMediaLoading && (
                <p className="col-span-full text-muted-foreground py-4"><LangText path="common.loading_media"  /></p>
              )}
              {!userMediaLoading && (() => {
                const images = userMedia.images ?? [];
                const videos = userMedia.videos ?? [];
                const audio = userMedia.audio ?? [];
                const allMedia = [
                  ...images.map((m) => ({ ...m, type: 'image' })),
                  ...videos.map((m) => ({ ...m, type: 'video' })),
                  ...audio.map((m) => ({ ...m, type: 'audio' })),
                ];
                if (allMedia.length === 0) {
                  return <p className="text-muted-foreground col-span-full py-4"><LangText path="common.no_media_yet"  /></p>;
                }
                return allMedia.map((item, index) => {
                  const postId = item.postId ?? item.PostId;
                  const order = item.order ?? item.Order ?? 0;
                  const url = item.url ?? item.Url ?? '';
                  const profileUserId = apiProfile?.userId ?? '';
                  return (
                    <div
                      key={`${postId}-${order}-${index}`}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => {
                        const returnTo = profileKey ? `${profilePath(profileKey)}?tab=media` : null;
                        if (profileUserId) {
                          navigate(index === 0 ? `/user/${profileUserId}/media` : `/user/${profileUserId}/media/${index}`, { state: returnTo ? { returnTo } : undefined });
                        } else {
                          navigate(postMediaPath(postId, order), { state: returnTo ? { returnTo } : undefined });
                        }
                      }}
                    >
                      {item.type === 'video' ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : item.type === 'audio' ? (
                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2 p-3 text-muted-foreground group-hover:bg-muted/80 transition-colors">
                          <Music className="w-10 h-10 shrink-0 opacity-80" aria-hidden />
                          <span className="text-xs font-medium text-center line-clamp-2">
                            <LangText path="common.audio"  />
                          </span>
                        </div>
                      ) : (
                        <img
                          src={url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </TabsContent>

          {/* About Tab - min-heights for consistent box sizes */}
          <TabsContent value="about" className="mt-6">
            <div className="bg-card rounded-xl border border-border p-6 sm:p-8 animate-fade-in">
              <div className="divide-y divide-border space-y-0">
                {/* Bio / About Description Section */}
                <section className="pb-8">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                    <LangText path="common.about"  />
                  </h3>
                  {(user.description || user.bio) ? (
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                      {user.description || user.bio}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      <LangText path="common.no_description_added"  />
                    </p>
                  )}
                </section>

                {/* Experience Section */}
                <section className="py-8">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                    <LangText path="common.experience"  />
                  </h3>
                  <div className="space-y-5">
                    {user.experience && user.experience.length > 0 ? (
                      user.experience.map((exp, i) => {
                        const start = exp.startDate ? new Date(exp.startDate).getFullYear() : '';
                        const end = exp.endDate ? new Date(exp.endDate).getFullYear() : (t('common.present'));
                        const duration =
                          start && exp.endDate
                            ? `${Math.round((new Date(exp.endDate) - new Date(exp.startDate)) / (365.25 * 24 * 60 * 60 * 1000))} ${t('common.years')}`
                            : start ? (t('common.present')) : '';
                        return (
                          <div key={exp.id || i} className="flex gap-4 items-start">
                            <div className="w-11 h-11 bg-muted rounded-lg flex items-center justify-center shrink-0">
                              <Building className="w-5 h-5 text-muted-foreground" aria-hidden />
                            </div>
                            <div className="min-w-0 pt-0.5">
                              <p className="font-medium text-foreground">{exp.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{exp.company}</p>
                              <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                                {start} – {end}
                                {duration ? ` · ${duration}` : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        <LangText path="common.no_experience_added"  />
                      </p>
                    )}
                  </div>
                </section>

                {/* Contact Section */}
                <section className="py-8">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                    <LangText path="common.contact"  />
                  </h3>
                  <dl className="space-y-4 text-sm">
                    {user.homeCountryCode ? (
                      <div className="flex gap-3 items-start">
                        <Globe2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            <LangText path="common.country"  />
                          </dt>
                          <dd className="mt-1 text-foreground font-medium">{getMarketCountryLabel(user.homeCountryCode, language)}</dd>
                        </div>
                      </div>
                    ) : null}
                    {user.contactEmail && (
                      <div className="flex gap-3 items-start">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            <LangText path="auth.email"  />
                          </dt>
                          <dd className="mt-1">
                            <a
                              href={`mailto:${user.contactEmail}`}
                              className="text-primary hover:underline break-all"
                            >
                              {user.contactEmail}
                            </a>
                          </dd>
                        </div>
                      </div>
                    )}
                    {user.linkedInProfileUrl && (
                      <div className="flex gap-3 items-start">
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                        <div>
                          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            <LangText path="common.linkedin"  />
                          </dt>
                          <dd className="mt-1">
                            <a
                              href={user.linkedInProfileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline break-all"
                            >
                              {user.linkedInProfileUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                          </dd>
                        </div>
                      </div>
                    )}
                    {!user.contactEmail && !user.linkedInProfileUrl && !user.homeCountryCode && (
                      <p className="text-sm text-muted-foreground">
                        <LangText path="common.no_contact_information_added"  />
                      </p>
                    )}
                  </dl>
                </section>

                {/* Website */}
                {user.website?.trim() ? (
                  <section className="pt-8">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                      <LangText path="profileSettings.website"  />
                    </h3>
                    <div className="flex gap-3 items-start">
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                      <a
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </TabsContent>

        </Tabs>

        {/* Followers / Following List Modal */}
        <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
          <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col gap-0">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {listModalType === 'followers'
                  ? <LangText path="people.followers"  />
                  : listModalType === 'connections'
                    ? <LangText path="notifications.connections"  />
                    : listModalType === 'profileViews'
                      ? <LangText path="common.who_viewed_your_profile"  />
                      : <LangText path="layout.following"  />}
                {' '}
                ({listTotalCount.toLocaleString()})
              </DialogTitle>
            </DialogHeader>
            <div
              ref={listScrollRef}
              className="h-[min(400px,60vh)] min-h-[200px] overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin flex-shrink-0"
            >
              <div className="space-y-2 pb-2">
                {listLoading && listData.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">
                    <LangText path="common.loading"  />
                  </p>
                ) : listData.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">
                    <LangText path="common.no_one_yet"  />
                  </p>
                ) : (
                  <>
                    {listData.map((p) => {
                      const listUserId = p.userId ?? p.id;
                      const isCurrentUser = Boolean(currentUser?.userId && listUserId && String(listUserId) === String(currentUser.userId));
                      return (
                        <UserCard
                          key={listUserId ?? p.handle ?? p.id}
                          user={listModalType === 'profileViews' || listModalType === 'connections' ? p : mapApiProfileToUserCard(p)}
                          variant="compact"
                          hideFollowButton={isCurrentUser}
                          onFollowChange={(targetUserId, followed) => {
                            setListData((prev) =>
                              prev.map((u) =>
                                u.userId === targetUserId ? { ...u, isFollowing: followed } : u,
                              ),
                            );
                            // When viewing own profile + following list: unfollowing decreases our following count
                            if (isOwnProfile && listModalType === 'following' && apiProfile) {
                              const delta = followed ? 1 : -1;
                              setApiProfile(prev => prev ? {
                                ...prev,
                                followingCount: Math.max(0, (prev.followingCount ?? 0) + delta),
                              } : prev);
                              setListTotalCount(prev => Math.max(0, prev + delta));
                            }
                            refetchProfile(); // Always refetch to sync with API (works for own or other profile)
                          }}
                        />
                      );
                    })}
                    {/* Sentinel for infinite scroll */}
                    {listModalType !== 'profileViews' && listPage < listTotalPages && (
                      <div ref={listSentinelRef} className="h-4 flex items-center justify-center py-4">
                        {listLoading && (
                          <span className="text-sm text-muted-foreground">
                            <LangText path="people.loading_more"  />
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {listData.length > 0 && listPage < listTotalPages && listModalType !== 'profileViews' && (
              <div className="flex-shrink-0 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={loadMoreList}
                  disabled={listLoading}
                >
                  {listLoading ? <LangText path="common.loading"  /> : <LangText path="common.load_more"  />}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Lightbox Modal */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="relative w-full h-[80vh] flex items-center justify-center p-8">
              {lightboxImage && (
                lightboxImage === apiProfile?.avatarUrl ? (
                  // Show avatar in circle
                  <div className="relative w-96 h-96">
                    <img
                      src={lightboxImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full border-4 border-white/20"
                    />
                  </div>
                ) : (
                  // Show cover image normally
                  <img
                    src={lightboxImage}
                    alt="Cover"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                )
              )}
            </div>
          </DialogContent>
        </Dialog>
        {!isOwnProfile && apiProfile?.userId && contentReportsEnabled ? (
          <ReportContentDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            contentType="User"
            contentId={String(apiProfile.userId)}
          />
        ) : null}
      </div>
    </MainLayout>
  );
};

export default Profile;
