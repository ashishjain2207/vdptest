/**
 * Home feed ad slots:
 * - First ad after the leading premium-partner block (same-market tier 4 posts at the top).
 * - Then one ad after every 2 posts in the remainder of the feed.
 */

export function isPremiumHomeFeedPost(post) {
  const tier = post?.homeFeedTier ?? post?.HomeFeedTier;
  if (tier === 4) {return true;}
  const premium = post?.organizationIsPremium ?? post?.OrganizationIsPremium;
  const international = post?.isInternationalHomeFeedItem ?? post?.IsInternationalHomeFeedItem;
  return premium === true && !international;
}

/** Index of the last post in the opening premium block, or -1 when none. */
export function findPremiumBlockEndIndex(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {return -1;}
  let end = -1;
  for (let i = 0; i < posts.length; i += 1) {
    if (isPremiumHomeFeedPost(posts[i])) {end = i;}
    else {break;}
  }
  return end;
}

/**
 * Ad carousel slot to show after post at `postIndex`, or -1 when no ad belongs there.
 * Slot 0 is the first ad (after premium block or after the first post when no premium block).
 */
export function feedAdSlotAfterPostIndex(postIndex, posts) {
  if (postIndex < 0 || !Array.isArray(posts) || postIndex >= posts.length) {return -1;}

  const premiumEnd = findPremiumBlockEndIndex(posts);
  if (premiumEnd >= 0 && postIndex === premiumEnd) {
    return 0;
  }

  if (premiumEnd < 0) {
    return postIndex % 2 === 0 ? postIndex / 2 : -1;
  }

  if (postIndex > premiumEnd) {
    const offset = postIndex - premiumEnd;
    return offset % 2 === 0 ? offset / 2 : -1;
  }

  return -1;
}
