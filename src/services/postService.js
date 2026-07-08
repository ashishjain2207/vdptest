import { apiRequest, apiGet, apiPost, apiDelete, apiPut } from './api/client.js';
import { API_BASE } from '@/lib/config';
import { toUserFacingRequestError } from '@/lib/networkErrorMessage';

const base = (API_BASE || '').replace(/\/$/, '');

async function throwPostError(res, fallback) {
  const err = await res.json().catch(() => ({}));
  const error = new Error(err?.message || res.statusText || fallback);
  error.status = res.status;
  error.code = err?.code;
  throw error;
}

/**
 * Get bookmarked posts for the current user. Requires auth.
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @returns {Promise<{ data: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function getBookmarks(page = 1, pageSize = 20) {
  const res = await apiGet(`${base}/api/Posts/bookmarks?page=${page}&pageSize=${pageSize}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load bookmarks');
  }
  return res.json();
}

/**
 * Get the feed (timeline) for the current user. Requires auth.
 * Works for all auth types: manual, Google, Microsoft, LinkedIn.
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @returns {Promise<{ data: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function getFeed(page = 1, pageSize = 20) {
  const res = await apiGet(`${base}/api/Posts/feed?page=${page}&pageSize=${pageSize}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load feed');
  }
  return res.json();
}

/**
 * Get the current user's bookmarked posts (paginated). Requires auth.
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options]
 * @returns {Promise<{ data: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function getBookmarkedPosts(page = 1, pageSize = 20, options = {}) {
  const res = await apiGet(`${base}/api/Posts/bookmarks?page=${page}&pageSize=${pageSize}`, options);
  if (!res.ok) {
    if (res.status === 401) {
      return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load bookmarks');
  }
  return res.json();
}

/**
 * Get posts that contain a specific hashtag (by tag text without #).
 * Use when opening a hashtag from a post or from Explore trending topics.
 * @param {string} tag - Hashtag text without # (e.g. "Sustainability").
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options]
 * @returns {Promise<{ data: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function getPostsByHashtag(tag, page = 1, pageSize = 20, options = {}) {
  const t = (tag || '').trim().replace(/^#/, '');
  if (!t) {
    return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
  const res = await apiGet(`${base}/api/Posts/by-hashtag?tag=${encodeURIComponent(t)}&page=${page}&pageSize=${pageSize}`, options);
  if (!res.ok) {
    if (res.status === 401) {
      return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load posts');
  }
  return res.json();
}

/**
 * Search posts by keyword in content (case-insensitive). Use for Explore when user searches by keyword (not hashtag).
 * @param {string} keyword - Search term (trimmed; empty returns empty result).
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options]
 * @returns {Promise<{ data: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function searchPosts(keyword, page = 1, pageSize = 20, options = {}) {
  const q = (keyword ?? '').trim();
  if (!q) {
    return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
  const res = await apiGet(
    `${base}/api/Posts/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
    options,
  );
  if (!res.ok) {
    if (res.status === 401) {
      return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to search posts');
  }
  return res.json();
}

/**
 * Get trending posts (posts with trending hashtags). Use for Explore default view.
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options]
 * @returns {Promise<{ data: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function getTrendingPosts(page = 1, pageSize = 20, options = {}) {
  const res = await apiGet(`${base}/api/Posts/trending?page=${page}&pageSize=${pageSize}`, options);
  if (!res.ok) {
    if (res.status === 401) { return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }; }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load trending posts');
  }
  return res.json();
}

/**
 * Get posts by user ID.
 * @param {string} userId
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options] - showLoader: false to avoid global loader (e.g. profile tab)
 * @returns {Promise<{ items: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function getPostsByUser(userId, page = 1, pageSize = 20, options = {}) {
  if (!userId) {return { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };}
  const res = await apiGet(`${base}/api/Posts/user/${encodeURIComponent(userId)}?page=${page}&pageSize=${pageSize}`, options);
  if (!res.ok) {
    if (res.status === 404) {return { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load posts');
  }
  return res.json();
}

/**
 * Get posts reposted by a user (reposts only).
 * @param {string} userId
 * @param {number} [page=1]
 * @param {number} [pageSize=20]
 * @param {{ showLoader?: boolean }} [options]
 * @returns {Promise<{ data: object[], totalCount: number, page: number, pageSize: number, totalPages: number }>}
 */
export async function getRepostsByUser(userId, page = 1, pageSize = 20, options = {}) {
  if (!userId) { return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }; }
  const res = await apiGet(`${base}/api/Posts/user/${encodeURIComponent(userId)}/reposts?page=${page}&pageSize=${pageSize}`, options);
  if (!res.ok) {
    if (res.status === 404) { return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }; }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load reposts');
  }
  return res.json();
}

/**
 * Records a view for a post (e.g. when a user opens the post detail page).
 * Unique view per user per post per 24h - refreshes within 24h don't increment.
 * @param {string} postId - Post ID (GUID).
 * @returns {Promise<{ recorded: boolean, viewsCount: number | null }>}
 */
export async function recordPostView(postId) {
  if (!postId) {
    return { recorded: false, viewsCount: null };
  }
  const res = await apiRequest(`${base}/api/Posts/${postId}/view`, { method: 'POST' }, false, false);
  if (!res.ok) {
    if (res.status === 401 || res.status === 404) {
      return { recorded: false, viewsCount: null };
    }
    const err = await res.json().catch(() => ({}));
    console.warn('Failed to record post view:', err?.message || res.statusText);
    return { recorded: false, viewsCount: null };
  }
  const data = await res.json().catch(() => ({}));
  const viewsCount = data?.viewsCount ?? data?.ViewsCount;
  return {
    recorded: data?.recorded === true || data?.Recorded === true,
    viewsCount: viewsCount === null || viewsCount === undefined ? null : Number(viewsCount),
  };
}

/**
 * Get a single post by ID.
 * @param {string} postId - Post ID (GUID).
 * @returns {Promise<object|null>}
 */
export async function getPostById(postId) {
  if (!postId) {return null;}
  const res = await apiGet(`${base}/api/Posts/${postId}`);
  if (!res.ok) {
    if (res.status === 404) {return null;}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load post');
  }
  return res.json();
}

/**
 * Get only the media list for a post (from API/DB). For media viewer.
 * @param {string} postId - Post ID (GUID).
 * @returns {Promise<Array<{ url: string, mediaType: string, mediaFileId: string }>>}
 */
export async function getPostMedia(postId) {
  if (!postId) {return [];}
  const res = await apiGet(`${base}/api/Posts/${postId}/media`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 404) {return [];}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load media');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Get aggregated media for all posts by a user (from API/DB). For profile Media tab.
 * Uses GET /api/Posts/user/{userId}/media (same data as GET /api/Users/{userId}/media).
 * @param {string} userId - User ID (author).
 * @returns {Promise<{ userId: string, images: Array<{ postId: string, order: number, url: string, mediaType: string }>, videos: Array, audio: Array }>}
 */
export async function getUserPostsMedia(userId) {
  if (!userId) {return { userId: '', images: [], videos: [], audio: [] };}
  const res = await apiGet(`${base}/api/Posts/user/${encodeURIComponent(userId)}/media`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load user media');
  }
  return res.json();
}

/**
 * Get all media for a user (GET /api/Users/{userId}/media). Same response as getUserPostsMedia.
 * Use for /user/:userId/media viewer.
 * @param {string} userId - User ID.
 * @returns {Promise<{ userId: string, images: Array<{ postId, order, url, mediaType }>, videos: Array, audio: Array }>}
 */
export async function getUserMedia(userId) {
  if (!userId) {return { userId: '', images: [], videos: [], audio: [] };}
  const res = await apiGet(`${base}/api/Users/${encodeURIComponent(userId)}/media`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load user media');
  }
  return res.json();
}

/**
 * Create a post with optional media (multipart/form-data).
 * @param {FormData} formData - Must include 'content', 'postType'; optional 'files' (multiple).
 * @returns {Promise<{ id: string, content: string, authorId: string, media?: Array<{ url: string }>, ... }>}
 */
export async function createPost(formData) {
  let res;
  try {
    res = await apiRequest(`${base}/api/Posts`, {
      method: 'POST',
      body: formData,
      showLoader: false,
    });
  } catch (e) {
    throw toUserFacingRequestError(e, { upload: true });
  }
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please log in to post. Your session may have expired.');
    }
    if (res.status === 413) {
      throw new Error('One or more images exceed the maximum upload size. Use smaller files or fewer attachments.');
    }
    await throwPostError(res, 'Failed to create post');
  }
  return res.json();
}

/**
 * Update a post (author only).
 * @param {string} postId - Post ID (GUID).
 * @param {FormData} formData - Must include 'content', 'postType'; optional 'files'.
 * @returns {Promise<object>}
 */
export async function updatePost(postId, formData) {
  let res;
  try {
    res = await apiRequest(`${base}/api/Posts/${postId}`, {
      method: 'PUT',
      body: formData,
      showLoader: true,
    });
  } catch (e) {
    throw toUserFacingRequestError(e, { upload: true });
  }
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to edit.');}
    if (res.status === 403) {throw new Error('You can only edit your own posts.');}
    if (res.status === 404) {throw new Error('Post not found.');}
    if (res.status === 413) {
      throw new Error('One or more images exceed the maximum upload size. Use smaller files or fewer attachments.');
    }
    await throwPostError(res, 'Failed to update post');
  }
  return res.json();
}

/**
 * Delete a post (soft delete). Authors may delete their own posts; partner moderators must pass a reason when deleting another member's post.
 * @param {string} postId - Post ID (GUID).
 * @param {{ reason?: string }} [options]
 */
export async function deletePost(postId, options = {}) {
  const reason = typeof options.reason === 'string' ? options.reason.trim() : '';
  const hasBody = reason.length > 0;
  const res = await apiRequest(`${base}/api/Posts/${postId}`, {
    method: 'DELETE',
    showLoader: false,
    ...(hasBody
      ? {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }
      : {}),
  });
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to delete.');}
    if (res.status === 403) {throw new Error('You are not allowed to delete this post.');}
    if (res.status === 404) {throw new Error('Post not found.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to delete post');
  }
}

/**
 * Add hashtags to a post (author only).
 * @param {string} postId - Post ID (GUID).
 * @param {string[]} tags - Hashtag text without # (e.g. ['PropTech', 'RealEstate']).
 */
export async function addHashtagsToPost(postId, tags) {
  if (!tags || tags.length === 0) {return;}
  const res = await apiPost(`${base}/api/Posts/${postId}/hashtags`, { tags }, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to add hashtags.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to add hashtags');
  }
}

/**
 * Replace a post's hashtags: old mappings are deactivated (IsActive = 0), new ones added. Author only.
 * Use when editing a post so search by removed hashtag no longer returns this post and search by new hashtag does.
 * @param {string} postId - Post ID (GUID).
 * @param {string[]} tags - Hashtag text without # (e.g. ['navya', 'sustainability']). Pass [] to clear.
 */
export async function updatePostHashtags(postId, tags) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/hashtags`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags: Array.isArray(tags) ? tags : [] }),
    showLoader: false,
  });
  if (!res.ok) {
    if (res.status === 401) { throw new Error('Please log in to update hashtags.'); }
    if (res.status === 403) { throw new Error('You can only edit your own posts.'); }
    if (res.status === 404) { throw new Error('Post not found.'); }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to update hashtags');
  }
}

/**
 * Add a poll to an existing post.
 * @param {string} postId - Post ID (GUID).
 * @param {{ question: string, optionTexts: string[], endsAt?: string|null }} dto
 * @returns {Promise<{ id: string, question: string, options: Array<{ id: string, text: string }>, ... }>}
 */
export async function createPoll(postId, dto) {
  const res = await apiPost(
    `${base}/api/Posts/${postId}/poll`,
    {
      question: dto.question,
      optionTexts: dto.optionTexts || [],
      endsAt: dto.endsAt ?? null,
    },
    { showLoader: false },
  );
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please log in to add a poll. Your session may have expired.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to add poll');
  }
  return res.json();
}

/**
 * Remove a media attachment from a post. Author only.
 * @param {string} postId - Post ID (GUID).
 * @param {string} mediaFileId - Media file ID (GUID) to remove.
 */
export async function removeMediaFromPost(postId, mediaFileId) {
  const res = await apiDelete(`${base}/api/Posts/${postId}/media/${mediaFileId}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) { throw new Error('Please log in to edit.'); }
    if (res.status === 403) { throw new Error('You can only edit your own posts.'); }
    if (res.status === 404) { throw new Error('Post or media not found.'); }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to remove media');
  }
}

/**
 * Update a poll (question and/or endsAt). Author of the post only.
 * @param {string} pollId - Poll ID (GUID).
 * @param {{ question: string, endsAt?: string|null }} dto
 * @returns {Promise<{ id: string, question: string, options: Array<{ id: string, text: string }>, ... }>}
 */
export async function updatePoll(pollId, dto) {
  const res = await apiPut(
    `${base}/api/Posts/poll/${pollId}`,
    { question: dto.question, endsAt: dto.endsAt ?? null },
    { showLoader: false },
  );
  if (!res.ok) {
    if (res.status === 401) { throw new Error('Please log in to edit poll.'); }
    if (res.status === 403) { throw new Error('You can only edit your own polls.'); }
    if (res.status === 404) { throw new Error('Poll not found.'); }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to update poll');
  }
  return res.json();
}

/**
 * Delete a poll from a post. Author of the post only.
 * @param {string} pollId - Poll ID (GUID).
 */
export async function deletePoll(pollId) {
  const res = await apiDelete(`${base}/api/Posts/poll/${pollId}`, { showLoader: false });
  if (!res.ok) {
    if (res.status === 401) { throw new Error('Please log in to edit.'); }
    if (res.status === 403) { throw new Error('You can only edit your own posts.'); }
    if (res.status === 404) { throw new Error('Poll not found.'); }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to delete poll');
  }
}

/**
 * Vote for a poll option.
 * @param {string} pollId - Poll ID (GUID).
 * @param {string} optionId - Option ID (GUID) to vote for.
 * @returns {Promise<{ id: string, question: string, options: Array<{ id: string, text: string, votesCount: number }>, ... }>}
 */
export async function votePoll(pollId, optionId) {
  const res = await apiPost(
    `${base}/api/Posts/poll/${pollId}/vote`,
    { optionId },
    { showLoader: false },
  );
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Please log in to vote. Your session may have expired.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to vote');
  }
  return res.json();
}

/**
 * Like a post. Requires auth.
 * @param {string} postId - Post ID (GUID).
 */
export async function likePost(postId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/like`, { method: 'POST' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to like.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to like');
  }
}

/**
 * Unlike a post. Requires auth.
 * @param {string} postId - Post ID (GUID).
 */
export async function unlikePost(postId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/like`, { method: 'DELETE' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to unlike.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to unlike');
  }
}

/**
 * Bookmark a post. Requires auth.
 * @param {string} postId - Post ID (GUID).
 */
export async function bookmarkPost(postId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/bookmark`, { method: 'POST' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to bookmark.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to bookmark');
  }
}

/**
 * Remove a bookmark. Requires auth.
 * @param {string} postId - Post ID (GUID).
 */
export async function unbookmarkPost(postId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/bookmark`, { method: 'DELETE' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to remove bookmark.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to remove bookmark');
  }
}

/**
 * Repost a post. Requires auth.
 * @param {string} postId - Post ID (GUID).
 */
export async function repostPost(postId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/repost`, { method: 'POST' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to repost.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to repost');
  }
}

/**
 * Remove a repost. Requires auth.
 * @param {string} postId - Post ID (GUID).
 */
export async function unrepostPost(postId) {
  const res = await apiRequest(`${base}/api/Posts/${postId}/repost`, { method: 'DELETE' }, false, false);
  if (!res.ok) {
    if (res.status === 401) {throw new Error('Please log in to remove repost.');}
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to remove repost');
  }
}
