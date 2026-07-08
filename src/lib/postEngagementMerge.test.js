import { describe, it, expect } from 'vitest';
import {
  engagementDetailHasMergeableFields,
  mergeFeedPostFromEngagementDetail,
} from './postEngagementMerge.js';

describe('engagementDetailHasMergeableFields', () => {
  it('is false for actor-only flags without counts', () => {
    expect(
      engagementDetailHasMergeableFields({
        likedByActor: true,
        postId: 'a',
        actingUserId: 'b',
      }),
    ).toBe(false);
  });

  it('is true when a count field is present', () => {
    expect(
      engagementDetailHasMergeableFields({
        likesCount: 3,
      }),
    ).toBe(true);
    expect(
      engagementDetailHasMergeableFields({
        viewsCount: 1,
      }),
    ).toBe(true);
  });
});

describe('mergeFeedPostFromEngagementDetail', () => {
  it('applies actor flags when acting user matches current user', () => {
    const post = { id: 'p1', likes: 1, isLiked: false };
    const merged = mergeFeedPostFromEngagementDetail(
      post,
      {
        postId: 'p1',
        likesCount: 2,
        likedByActor: true,
        actingUserId: 'user-1',
      },
      'user-1',
    );
    expect(merged).toEqual({ ...post, likes: 2, isLiked: true });
  });

  it('ignores actor flags for another user but still merges counts', () => {
    const post = { id: 'p1', likes: 1, isLiked: false };
    const merged = mergeFeedPostFromEngagementDetail(
      post,
      {
        postId: 'p1',
        likesCount: 5,
        likedByActor: true,
        actingUserId: 'other',
      },
      'me',
    );
    expect(merged).toEqual({ ...post, likes: 5, isLiked: false });
  });

  it('merges viewsCount for any viewer', () => {
    const post = { id: 'p1', views: 2 };
    const merged = mergeFeedPostFromEngagementDetail(
      post,
      { postId: 'p1', viewsCount: 9 },
      'viewer',
    );
    expect(merged).toEqual({ ...post, views: 9 });
  });
});
