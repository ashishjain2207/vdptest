import { describe, expect, it } from 'vitest';
import {
  feedAdSlotAfterPostIndex,
  findPremiumBlockEndIndex,
  isPremiumHomeFeedPost,
} from './feedAdPlacement';

describe('feedAdPlacement', () => {
  const premium = { homeFeedTier: 4, organizationIsPremium: true };
  const standard = { homeFeedTier: 3, organizationIsPremium: false };
  const personal = { homeFeedTier: 1 };

  it('detects premium home feed posts', () => {
    expect(isPremiumHomeFeedPost(premium)).toBe(true);
    expect(isPremiumHomeFeedPost({ organizationIsPremium: true, isInternationalHomeFeedItem: true })).toBe(false);
    expect(isPremiumHomeFeedPost(standard)).toBe(false);
  });

  it('finds premium block end', () => {
    expect(findPremiumBlockEndIndex([premium, premium, standard, personal])).toBe(1);
    expect(findPremiumBlockEndIndex([personal, premium])).toBe(-1);
    expect(findPremiumBlockEndIndex([])).toBe(-1);
  });

  it('places first ad after premium block then every 2 posts', () => {
    const posts = [premium, premium, standard, personal, personal, personal];
    expect(feedAdSlotAfterPostIndex(1, posts)).toBe(0);
    expect(feedAdSlotAfterPostIndex(3, posts)).toBe(1);
    expect(feedAdSlotAfterPostIndex(5, posts)).toBe(2);
    expect(feedAdSlotAfterPostIndex(2, posts)).toBe(-1);
  });

  it('without premium block, ads follow every 2 posts from the first', () => {
    const posts = [personal, personal, personal, personal];
    expect(feedAdSlotAfterPostIndex(0, posts)).toBe(0);
    expect(feedAdSlotAfterPostIndex(1, posts)).toBe(-1);
    expect(feedAdSlotAfterPostIndex(2, posts)).toBe(1);
    expect(feedAdSlotAfterPostIndex(3, posts)).toBe(-1);
  });
});
