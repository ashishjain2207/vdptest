import { apiGet, apiPost } from './api/client.js';
import { API_BASE } from '@/lib/config';

const base = (API_BASE || '').replace(/\/$/, '');

/**
 * Active dashboard advertisements (feed list + sidebar list for carousel).
 * @returns {Promise<{ feedAds: Array<object>, sidebarAds: Array<object> }>}
 */
function pickCaseInsensitive(obj, ...names) {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  for (const n of names) {
    if (n in obj) {
      return obj[n];
    }
  }
  const lower = Object.fromEntries(Object.keys(obj).map((k) => [k.toLowerCase(), obj[k]]));
  for (const n of names) {
    const v = lower[n.toLowerCase()];
    if (v !== undefined) {
      return v;
    }
  }
  return undefined;
}

function isSidebarPlacement(ad) {
  const p = ad?.placement ?? ad?.Placement;
  if (p === 1 || p === '1') {
    return true;
  }
  if (typeof p === 'string') {
    return p.toLowerCase() === 'sidebar';
  }
  return false;
}

function hasPlacementMetadata(ad) {
  return Boolean(ad) && typeof ad === 'object' && ('placement' in ad || 'Placement' in ad);
}

function partitionActiveAdsByPlacement(feedAds, sidebarAds) {
  const normalizedFeedAds = Array.isArray(feedAds) ? feedAds.filter(Boolean) : [];
  const normalizedSidebarAds = Array.isArray(sidebarAds) ? sidebarAds.filter(Boolean) : [];
  const allAds = [...normalizedFeedAds, ...normalizedSidebarAds];
  if (!allAds.some(hasPlacementMetadata)) {
    return {
      feedAds: normalizedFeedAds,
      sidebarAds: normalizedSidebarAds,
    };
  }

  const byId = new Map();
  for (const ad of allAds) {
    if (!ad || typeof ad !== 'object') {
      continue;
    }
    const id = String(ad.id ?? ad.Id ?? '').trim();
    if (id) {
      byId.set(id, ad);
    }
  }

  const feed = [];
  const sidebar = [];
  for (const ad of byId.values()) {
    if (isSidebarPlacement(ad)) {
      sidebar.push(ad);
    } else {
      feed.push(ad);
    }
  }

  return {
    feedAds: feed,
    sidebarAds: sidebar.length > 0 ? sidebar : normalizedSidebarAds,
  };
}

function normalizeActiveAdsPayload(raw) {
  const root = raw && typeof raw === 'object' ? raw : {};
  const inner = root.data ?? root.Data ?? root;

  let feedAds = pickCaseInsensitive(inner, 'feedAds', 'FeedAds');
  const legacyFeed = pickCaseInsensitive(inner, 'feed', 'Feed');
  if (!Array.isArray(feedAds)) {
    feedAds = legacyFeed ? [legacyFeed] : [];
  } else if (feedAds.length === 0 && legacyFeed) {
    feedAds = [legacyFeed];
  }

  let sidebarAds = pickCaseInsensitive(inner, 'sidebarAds', 'SidebarAds');
  if (!Array.isArray(sidebarAds)) {
    const legacy = inner?.sidebar ?? inner?.Sidebar ?? null;
    if (legacy && typeof legacy === 'object') {
      sidebarAds = [legacy];
    } else {
      sidebarAds = [];
    }
  }

  return partitionActiveAdsByPlacement(
    feedAds.filter(Boolean),
    sidebarAds.filter(Boolean),
  );
}

export { partitionActiveAdsByPlacement };

export async function getActivePlatformAdvertisements() {
  const res = await apiGet(`${base}/api/Advertisements/active`, { showLoader: false });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || res.statusText || 'Failed to load advertisements');
  }
  const data = await res.json();
  return normalizeActiveAdsPayload(data);
}

/**
 * @param {string} adId
 * @param {{ userSessionId: string, renderEventId: string, viewablePixelsPct: number, timeInViewportMs: number }} metrics
 */
export function recordPlatformAdImpression(adId, metrics) {
  if (!adId || !metrics || typeof metrics !== 'object') {
    return;
  }
  const body = {
    userSessionId: String(metrics.userSessionId || ''),
    renderEventId: String(metrics.renderEventId || ''),
    viewablePixelsPct: Number(metrics.viewablePixelsPct),
    timeInViewportMs: Math.round(Number(metrics.timeInViewportMs)),
  };
  if (!body.userSessionId || !body.renderEventId) {
    return;
  }
  void apiPost(`${base}/api/Advertisements/${encodeURIComponent(adId)}/impressions`, body, { showLoader: false }).catch(
    () => {},
  );
}

/** @param {string} adId */
export function recordPlatformAdClick(adId) {
  if (!adId) {
    return;
  }
  void apiPost(`${base}/api/Advertisements/${encodeURIComponent(adId)}/clicks`, {}, { showLoader: false }).catch(() => {});
}
