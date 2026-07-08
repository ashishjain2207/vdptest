import { describe, expect, it } from 'vitest';
import { partitionActiveAdsByPlacement } from '@/services/platformAdvertisementService';

describe('platformAdvertisementService', () => {
  it('keeps feed empty when placement metadata has only sidebar campaigns', () => {
    const sidebarAd = { id: 'ad-1', placement: 'sidebar', title: 'Sidebar only' };
    const result = partitionActiveAdsByPlacement([sidebarAd], []);

    expect(result.feedAds).toEqual([]);
    expect(result.sidebarAds).toEqual([sidebarAd]);
  });

  it('partitions feed and sidebar when placement metadata is present', () => {
    const feedAd = { id: 'feed-1', placement: 'feed', title: 'Feed' };
    const sidebarAd = { id: 'side-1', Placement: 'Sidebar', title: 'Sidebar' };
    const result = partitionActiveAdsByPlacement([feedAd, sidebarAd], []);

    expect(result.feedAds).toEqual([feedAd]);
    expect(result.sidebarAds).toEqual([sidebarAd]);
  });

  it('preserves legacy lists when no placement metadata exists', () => {
    const feedAd = { id: 'legacy-feed', title: 'Legacy feed' };
    const sidebarAd = { id: 'legacy-side', title: 'Legacy sidebar' };
    const result = partitionActiveAdsByPlacement([feedAd], [sidebarAd]);

    expect(result.feedAds).toEqual([feedAd]);
    expect(result.sidebarAds).toEqual([sidebarAd]);
  });
});
