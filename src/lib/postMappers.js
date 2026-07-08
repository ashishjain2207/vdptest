import { parseUtcIso } from '@/lib/utils';

/** Map API poll (camelCase or PascalCase) to feed poll shape. */
export function mapApiPollToFeedPoll(poll) {
  if (!poll) {return undefined;}
  const options = poll.options ?? poll.Options ?? [];
  const opts = options.map((o) => ({
    id: o.id ?? o.Id ?? null,
    text: o.text ?? o.Text ?? '',
    votes: o.votesCount ?? o.VotesCount ?? 0,
  }));
  const totalVotes = opts.reduce((s, o) => s + o.votes, 0);
  const endsAt = poll.endsAt ?? poll.EndsAt;
  let endsIn = '';
  if (endsAt) {
    const end = typeof endsAt === 'string' ? parseUtcIso(endsAt) : endsAt;
    const left = end.getTime() - Date.now();
    if (left > 0) {endsIn = `${Math.ceil(left / 86400000)} days`;}
    else {endsIn = 'Ended';}
  } else {endsIn = 'No end date';}
  return {
    id: poll.id ?? poll.Id ?? null,
    question: poll.question ?? poll.Question,
    options: opts,
    totalVotes,
    endsIn,
    userVotedOptionId: poll.userVotedOptionId ?? poll.UserVotedOptionId ?? null,
  };
}

/** Map API PostDto (camelCase or PascalCase) to the shape PostCard expects. */
export function mapApiPostToFeedPost(apiPost, options = {}) {
  const { useCurrentUserAsAuthor = false, currentUserAvatar, currentUser: optCurrentUser } = options;
  const id = apiPost.id ?? apiPost.Id;
  const authorId = apiPost.authorId ?? apiPost.AuthorId ?? '';
  const authorDisplayName = apiPost.authorDisplayName ?? apiPost.AuthorDisplayName ?? 'User';
  const authorHandle = apiPost.authorHandle ?? apiPost.AuthorHandle ?? '';
  const authorIsVerified = apiPost.authorIsVerified ?? apiPost.AuthorIsVerified ?? false;
  const authorAvatarUrl = apiPost.authorAvatarUrl ?? apiPost.AuthorAvatarUrl ?? null;
  const content = apiPost.content ?? apiPost.Content ?? '';
  const media = apiPost.media ?? apiPost.Media ?? [];
  const poll = apiPost.poll ?? apiPost.Poll;
  const createdAt = apiPost.createdAt ?? apiPost.CreatedAt;
  const updatedAt = apiPost.updatedAt ?? apiPost.UpdatedAt ?? createdAt;
  const likesCount = apiPost.likesCount ?? apiPost.LikesCount ?? 0;
  const commentsCount = apiPost.commentsCount ?? apiPost.CommentsCount ?? 0;
  const repostsCount = apiPost.repostsCount ?? apiPost.RepostsCount ?? 0;
  const viewsCount = apiPost.viewsCount ?? apiPost.ViewsCount ?? 0;
  const isLiked = apiPost.isLiked ?? apiPost.IsLiked ?? false;
  const isBookmarked = apiPost.isBookmarked ?? apiPost.IsBookmarked ?? false;
  const isReposted = apiPost.isReposted ?? apiPost.IsReposted ?? false;
  const isRepost = apiPost.isRepost ?? apiPost.IsRepost ?? false;
  const repostedAt = apiPost.repostedAt ?? apiPost.RepostedAt ?? null;
  const reposterUserId = apiPost.reposterUserId ?? apiPost.ReposterUserId ?? null;
  const reposterDisplayName = apiPost.reposterDisplayName ?? apiPost.ReposterDisplayName ?? null;
  const reposterHandle = apiPost.reposterHandle ?? apiPost.ReposterHandle ?? null;
  const reposterAvatarUrl = apiPost.reposterAvatarUrl ?? apiPost.ReposterAvatarUrl ?? null;
  const reposter =
    isRepost && (reposterUserId || reposterDisplayName)
      ? {
        userId: reposterUserId,
        name: reposterDisplayName ?? 'User',
        handle: String(reposterHandle ?? '').replace(/^@/, ''),
        avatar: reposterAvatarUrl?.trim() ? reposterAvatarUrl : null,
      }
      : null;

  const avatarToUse = useCurrentUserAsAuthor && currentUserAvatar
    ? (currentUserAvatar?.trim() ? currentUserAvatar : null)
    : (authorAvatarUrl?.trim() ? authorAvatarUrl : null);

  const cu = optCurrentUser;
  const author = {
    avatar: avatarToUse,
    name: useCurrentUserAsAuthor && cu ? (cu.name ?? cu.displayName ?? authorDisplayName) : authorDisplayName,
    handle: (useCurrentUserAsAuthor && cu ? (cu.handle ?? authorHandle) : authorHandle).replace(/^@/, ''),
    isVerified: useCurrentUserAsAuthor && cu ? (cu.isVerified ?? authorIsVerified) : authorIsVerified,
  };

  let timestamp = 'Just now';
  if (createdAt) {
    const date = typeof createdAt === 'string' ? parseUtcIso(createdAt) : createdAt;
    const diff = date ? Date.now() - date.getTime() : 0;
    if (diff >= 86400000) {timestamp = `${Math.floor(diff / 86400000)}d`;}
    else if (diff >= 3600000) {timestamp = `${Math.floor(diff / 3600000)}h`;}
    else if (diff >= 60000) {timestamp = `${Math.floor(diff / 60000)}m`;}
  }

  const firstImage = Array.isArray(media) && media.length > 0
    ? (media[0].url ?? media[0].Url)
    : null;
  const image = firstImage || undefined;

  const mappedPoll = mapApiPollToFeedPoll(poll);

  const organizationId = apiPost.organizationId ?? apiPost.OrganizationId ?? null;
  const organizationName = apiPost.organizationName ?? apiPost.OrganizationName ?? '';
  const organizationHandle = String(apiPost.organizationHandle ?? apiPost.OrganizationHandle ?? '')
    .trim()
    .replace(/^@/, '');
  const organizationTierRaw = apiPost.organizationTier ?? apiPost.OrganizationTier;
  const organizationIsPremiumFromApi =
    apiPost.organizationIsPremium ?? apiPost.OrganizationIsPremium;
  const organizationTier =
    organizationTierRaw === 'Premium' || organizationTierRaw === 'Standard'
      ? organizationTierRaw
      : organizationId
        ? (organizationIsPremiumFromApi === true ? 'Premium' : 'Standard')
        : undefined;
  const organizationIsPremium = organizationId
    ? organizationTier === 'Premium'
    : organizationIsPremiumFromApi === true
      ? true
      : organizationIsPremiumFromApi === false
        ? false
        : undefined;

  return {
    id: id?.toString?.() ?? id,
    authorId,
    author,
    organizationId,
    organizationName,
    organizationHandle,
    organizationIsPremium,
    organizationTier,
    content,
    image,
    media,
    poll: mappedPoll,
    likes: likesCount,
    comments: commentsCount,
    reposts: repostsCount,
    views: viewsCount,
    timestamp,
    createdAt,
    updatedAt,
    isLiked,
    isBookmarked,
    isReposted,
    isRepost,
    repostedAt,
    reposter,
    postType: apiPost.postType ?? apiPost.PostType ?? 'post',
    canModeratePartnerPost: apiPost.canModeratePartnerPost ?? apiPost.CanModeratePartnerPost,
  };
}

export function normalizePostId(id) {
  return String(id ?? '').toLowerCase();
}

/** Prepend a post to a feed list, dropping any existing row with the same id. */
export function prependUniqueFeedPost(posts, post) {
  const id = normalizePostId(post?.id);
  if (!id) {
    return [post, ...posts];
  }
  return [post, ...posts.filter((p) => normalizePostId(p.id) !== id)];
}
