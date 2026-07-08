import { Paperclip, MapPin, BarChart3, Link2, Smile, Send, X, Loader2, Navigation } from 'lucide-react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Textarea,
} from '@imriva/framework';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { cn, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { LocationPicker, getCurrentLocationAndAddress, getLocationPopoverDismissHandlers } from '@/components/ui/LocationPicker';
import { useLocationAttachmentPopover } from '@/hooks/useLocationAttachmentPopover';
import { getAccessToken, refreshTokens } from '@/services/auth/authService.js';
import { createPost as apiCreatePost, createPoll as apiCreatePoll, getPostById, addHashtagsToPost as apiAddHashtagsToPost } from '@/services/postService';
import { prepareFilesForPostMultipart } from '@/services/mediaService.js';
import { useMentionSuggestions } from '@/hooks/useMentionSuggestions';
import { LangText } from '@/components/ui/LangText';
import { dispatchFeedEvent, FEED_EVENTS } from '@/lib/feedEvents';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, resolveLocalizedMessage, useT, useTParams } from '@/i18n';
import { canPublishPostComposer } from '@/lib/postComposer';
import { staffCanPublishToSelectedMarket } from '@/lib/marketCountryAccess';
import { usePlatformAccess } from '@/lib/platformAuth';
import { useAdminScopeCountry } from '@/contexts/AdminScopeCountryContext';
import { resolveLocationForPublish } from '@/lib/postContent';
import { MAX_POLL_OPTIONS } from '@/lib/pollLimits';
import { mergeValidatedPostMediaFiles } from '@/lib/postMediaUpload';
import { buildPostImageCropQueue } from '@/lib/postImageCrop';
import { LocalPostMediaFileThumb } from '@/components/post/PostMediaGrid';
import { getUploadPolicy } from '@/services/uploadPolicyService';
import { useImageCropQueue } from '@/hooks/useImageCropQueue';
import { ImageCropFlow } from '@/components/ImageCropFlow';
import { ModerationAlert } from '@/components/common/ModerationAlert';
import { getModerationErrorMessage, isModerationError } from '@/utils/moderationError';

const MAX_LENGTH = 2000;
const MAX_MEDIA = 10;
const POST_MODERATION_FALLBACK = 'This post couldn’t be published because it may violate platform rules. Please edit the content and try again.';

const EMOJI_LIST = ['😊', '👍', '❤️', '🔥', '📈', '🏠', '🏢', '📷', '✨', '💼', '🌱', '📌', '📍', '🔗', '✅', '💡', '🎯', '📊', '🏆', '🙌'];

/** Extract display domain from URL for link card (e.g. "https://example.com/page" → "example.com"). */
function getLinkDomain(url) {
  try {
    const u = new URL(url.trim().startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.trim().slice(0, 32);
  }
}

export function CreatePost({ onPostCreated, variant, onOpenChange, organizationId }) {
  const { language } = useLanguage();
  const tr = useTParams();
  const toastT = useT();
  const { isPlatformStaff } = usePlatformAccess();
  const { country: staffScopeCountry } = useAdminScopeCountry();
  const label = (key) => t(language, `feed.${key}`);
  const { user: authUser } = useAuth();
  const avatarUrl = authUser?.avatarUrl;
  const displayName = authUser?.displayName ?? authUser?.handle ?? 'User';

  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(/** @type {File[]} */ ([]));
  const [poll, setPoll] = useState(/** @type {{ question: string, optionTexts: string[] } | null} */ (null));
  const [linkUrl, setLinkUrl] = useState('');
  const [location, setLocation] = useState('');
  const [linkDraft, setLinkDraft] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [showLinkOpen, setShowLinkOpen] = useState(false);
  const [showLocationOpen, setShowLocationOpen] = useState(false);
  const [showEmojiOpen, setShowEmojiOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationError, setModerationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploadPolicy, setUploadPolicy] = useState(null);
  const [uploadAccept, setUploadAccept] = useState('image/*');
  const { cropper, enqueue: enqueueImageCrop } = useImageCropQueue();
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const textareaRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const locationPickerRef = useRef(/** @type {{ confirmSelection?: () => { committed: boolean, value: string } } | null} */ (null));
  const { handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, handleBlur: handleMentionBlur, MentionDropdown } = useMentionSuggestions({
    content,
    setContent,
    inputRef: textareaRef,
    currentUserId: authUser?.userId,
  });

  useEffect(() => {
    if (showLinkOpen) {setLinkDraft(linkUrl);}
  }, [showLinkOpen, linkUrl]);

  useEffect(() => {
    let cancelled = false;
    getUploadPolicy('postAttachment')
      .then((p) => {
        if (cancelled) { return; }
        setUploadPolicy(p);
        setUploadAccept((p?.accept && String(p.accept).trim()) ? p.accept : 'image/*');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const committedLocation = location.trim();
  const locationForPublish = () =>
    resolveLocationForPublish({
      location,
      locationDraft,
      locationPopoverOpen: showLocationOpen,
      confirmPickerSelection: () => locationPickerRef.current?.confirmSelection?.(),
    });

  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const charPercentage = Math.min((charCount / MAX_LENGTH) * 100, 100);

  const canSubmit =
    canPublishPostComposer({
      content,
      selectedFiles,
      linkUrl,
      location: committedLocation || (showLocationOpen ? locationDraft.trim() : ''),
      poll,
    }) && !isOverLimit && !isSubmitting;
  const showPollEditor = poll !== null;

  const openAttachmentPicker = () => fileInputRef.current?.click();
  const clearModerationError = () => {
    if (moderationError) { setModerationError(''); }
  };

  const {
    handleLocationPopoverOpenChange,
    handleLocationSelect,
    confirmLocationFromPicker,
  } = useLocationAttachmentPopover({
    location,
    locationDraft,
    setLocation,
    setLocationDraft,
    setShowLocationOpen,
    clearModerationError,
  });

  const applyMergedFiles = (files) => {
    clearModerationError();
    const { next, errors } = mergeValidatedPostMediaFiles(files, selectedFiles, MAX_MEDIA, uploadPolicy);
    setSelectedFiles(next);
    errors.forEach((err) => {
      toast.error(resolveLocalizedMessage(language, err));
    });
  };

  const handleFileChange = (e) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    const input = e.target;
    if (input) {
      input.value = '';
    }
    if (!picked.length) {
      return;
    }
    const { rasterItems, passthrough } = buildPostImageCropQueue(picked, selectedFiles, language);
    if (!rasterItems.length) {
      applyMergedFiles(passthrough);
      return;
    }
    enqueueImageCrop(rasterItems, (cropped) => {
      applyMergedFiles([...passthrough, ...cropped]);
    });
  };

  const removeFile = (index) => {
    clearModerationError();
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addPoll = () => {
    clearModerationError();
    setPoll({ question: '', optionTexts: ['', ''] });
  };

  const setPollQuestion = (question) => {
    clearModerationError();
    setPoll((p) => (p ? { ...p, question } : null));
  };

  const setPollOption = (index, text) => {
    clearModerationError();
    setPoll((p) => {
      if (!p) {return null;}
      const next = [...p.optionTexts];
      next[index] = text;
      return { ...p, optionTexts: next };
    });
  };

  const addPollOption = () => {
    clearModerationError();
    setPoll((p) =>
      p && p.optionTexts.length < MAX_POLL_OPTIONS
        ? { ...p, optionTexts: [...p.optionTexts, ''] }
        : p,
    );
  };

  const removePollOption = (index) => {
    clearModerationError();
    setPoll((p) => {
      if (!p || p.optionTexts.length <= 2) {return p;}
      return { ...p, optionTexts: p.optionTexts.filter((_, i) => i !== index) };
    });
  };

  const removePoll = () => {
    clearModerationError();
    setPoll(null);
  };

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { address } = await getCurrentLocationAndAddress();
      clearModerationError();
      setLocation(address);
      setLocationDraft(address);
      setShowLocationOpen(false);
    } catch (err) {
      const code = err?.code;
      if (code === 1) {
        toast.error(toastT('toasts.locationDenied'), { duration: 6000 });
      } else if (code === 2) {
        toast.error(toastT('toasts.locationUnavailable'), { duration: 5000 });
      } else if (code === 3) {
        toast.error(toastT('toasts.locationTimeout'), { duration: 5000 });
      } else {
        toast.error(err?.message || toastT('toasts.locationGetFailed'), { duration: 5000 });
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const insertEmoji = (emoji) => {
    clearModerationError();
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = content.slice(0, start);
      const after = content.slice(end);
      setContent(before + emoji + after);
      setShowEmojiOpen(false);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(before.length + emoji.length, before.length + emoji.length);
      }, 0);
    } else {
      setContent((c) => c + emoji);
      setShowEmojiOpen(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {return;}

    let token = getAccessToken();
    if (!token) {
      try {
        await refreshTokens();
        token = getAccessToken();
      } catch {
        // ignore
      }
    }
    if (!token) {
      toast.error(
        'Please log in to post. If you just logged in, refresh the page and try again.',
        { duration: 5000 },
      );
      return;
    }

    let finalContent = content.trim();
    if (linkUrl.trim()) {finalContent += (finalContent ? '\n' : '') + linkUrl.trim();}
    const savedLocation = locationForPublish();
    if (savedLocation) {finalContent += `${finalContent ? '\n' : ''  }📍 ${  savedLocation}`;}
    if (
      !canPublishPostComposer({
        content: finalContent,
        selectedFiles,
        linkUrl: '',
        location: '',
        poll,
      })
    ) {
      return;
    }
    if (!staffCanPublishToSelectedMarket(isPlatformStaff, staffScopeCountry)) {
      toast.error(toastT('feed.selectCountryScopeBeforePost'));
      return;
    }
    const contentToSend = finalContent.trim();

    // API expects PostType enum: Post, Update, or Discussion (not Standard/Image/Video)
    const postType = 'Post';

    setIsSubmitting(true);
    try {
      setModerationError('');
      const formData = new FormData();
      // Match CreatePostModal: non-empty placeholder so media-only / poll-only posts pass API validation when body text is empty.
      formData.append('content', contentToSend || ' ');
      formData.append('postType', postType);
      if (organizationId) {
        formData.append('organizationId', organizationId);
      }
      const preparedFiles = await prepareFilesForPostMultipart(selectedFiles);
      preparedFiles.forEach((f) => formData.append('files', f));

      const post = await apiCreatePost(formData);

      const hasPoll =
        poll &&
        poll.question.trim() &&
        poll.optionTexts.filter((opt) => opt?.trim()).length >= 2;
      const hashtags = [...new Set((contentToSend.match(/#[\w]+/g) || []).map((tag) => tag.slice(1).toLowerCase()))];
      const hasHashtags = hashtags.length > 0;

      if (hasPoll) {
        try {
          await apiCreatePoll(post.id, {
            question: poll.question.trim(),
            optionTexts: poll.optionTexts.map((opt) => opt?.trim()).filter(Boolean),
          });
        } catch (pollErr) {
          toast.error(pollErr.message || 'Poll could not be added');
        }
      }
      if (hasHashtags) {
        try {
          await apiAddHashtagsToPost(post.id, hashtags);
        } catch (hashtagErr) {
          toast.error(hashtagErr.message || 'Hashtags could not be saved');
        }
      }

      // Partner posts: refetch so DTO includes org flags, poll, and engagement for correct PostCard behavior
      const needsFullPost = hasPoll || hasHashtags || Boolean(organizationId);
      const fullPost = needsFullPost
        ? ((await getPostById(post.id).catch(() => null)) ?? post)
        : post;
      onPostCreated?.(fullPost ?? post);
      dispatchFeedEvent(FEED_EVENTS.POST_CREATED, { post: fullPost ?? post });
      toast.success(toastT('posts.publishSuccess'));

      setContent('');
      setSelectedFiles([]);
      setPoll(null);
      setLinkUrl('');
      setLocation('');
      setShowLinkOpen(false);
      setShowLocationOpen(false);
      setShowEmojiOpen(false);
      setIsFocused(false);
      if (onOpenChange) { onOpenChange(false); }
    } catch (err) {
      if (isModerationError(err)) {
        setModerationError(getModerationErrorMessage(err, POST_MODERATION_FALLBACK));
        return;
      }
      const msg = err?.message || 'Failed to create post';
      const isAuthError = msg.toLowerCase().includes('log in') || msg.toLowerCase().includes('session');
      toast.error(
        isAuthError ? 'Session expired or invalid. Please log in again and try posting.' : msg,
        { duration: 5000 },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isModal = variant === 'modal';
  // In modal, popovers portal to body so they appear above the dialog; use higher z-index so they are not under the modal.
  const popoverZClass = isModal ? 'z-[10050]' : '';

  return (
    <form
      data-testid="create-post-composer"
      className={cn(
        'rounded-xl p-4 transition-shadow block',
        isModal ? 'border-0 bg-transparent shadow-none' : 'bg-card border border-border',
        !isModal && isFocused && 'shadow-soft',
      )}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="min-w-0">
        <input
          ref={fileInputRef}
          type="file"
          accept={uploadAccept}
          multiple
          className="hidden"
          data-testid="create-post-file-input"
          aria-label={label('addImage')}
          onChange={handleFileChange}
        />

        <div className="flex gap-3">
          <Avatar className="w-11 h-11 flex-shrink-0">
            {avatarUrl?.trim() ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-sm font-medium">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {authUser && (
              <div className="mb-2 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight truncate">{displayName}</p>
              </div>
            )}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={label('sharePrompt')}
                aria-label={toastT('posts.post_content')}
                data-testid="create-post-content-input"
                className={cn(
                  'min-h-[70px] resize-none border-none bg-transparent p-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground',
                  isFocused && 'min-h-[100px]',
                )}
                value={content}
                onChange={(e) => {
                  clearModerationError();
                  handleMentionChange(e);
                }}
                onKeyDown={handleMentionKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  const hasAttachments =
                    selectedFiles.length > 0 ||
                    poll !== null ||
                    linkUrl.trim() ||
                    location.trim();
                  if (!content && !hasAttachments) {setIsFocused(false);}
                  handleMentionBlur();
                }}
              />
              {MentionDropdown()}
            </div>

            {/* Media previews */}
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <div data-testid="create-post-media-preview-list" className="contents">
                {selectedFiles.map((file, i) => (
                  <LocalPostMediaFileThumb
                    key={`${file.name}-${file.size}-${i}`}
                    file={file}
                    onRemove={() => removeFile(i)}
                    removeAriaLabel={toastT('posts.remove')}
                  />
                ))}
                </div>
              </div>
            )}

            {/* Poll editor */}
            {showPollEditor && (
              <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <Input
                  placeholder={toastT('posts.ask_a_question')}
                  aria-label={toastT('posts.poll_question')}
                  data-testid="create-post-poll-question-input"
                  value={poll?.question ?? ''}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="bg-background"
                />
                {(poll?.optionTexts ?? []).map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={tr('time.pollOption', { n: i + 1 })}
                      aria-label={tr('time.pollOptionAria', { n: i + 1 })}
                      data-testid={`create-post-poll-option-${i + 1}`}
                      value={opt}
                      onChange={(e) => setPollOption(i, e.target.value)}
                      className="bg-background"
                    />
                    {(poll?.optionTexts?.length ?? 0) > 2 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePollOption(i)} aria-label="Remove option">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {(poll?.optionTexts?.length ?? 0) < MAX_POLL_OPTIONS && (
                  <Button type="button" variant="outline" size="sm" onClick={addPollOption}>
                    <LangText path="posts.add_option"  />
                  </Button>
                )}
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={removePoll}>
                    <LangText path="posts.remove_poll"  />
                  </Button>
                </div>
              </div>
            )}

            {/* Link attachment card (modern theme) */}
            {linkUrl.trim() && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground"><LangText path="posts.link"  /></p>
                  <a
                    href={linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    title={linkUrl.trim()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getLinkDomain(linkUrl)}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setLinkUrl('')}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Remove link"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Location attachment card (modern theme) */}
            {!showLocationOpen && committedLocation && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground"><LangText path="partners.location"  /></p>
                  <p className="truncate text-sm font-medium text-foreground">📍 {committedLocation}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLocation('');
                    setLocationDraft('');
                  }}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Remove location"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {moderationError && (
              <div className="mt-3">
                <ModerationAlert
                  title="Post not published"
                  message={moderationError}
                  onDismiss={() => setModerationError('')}
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon" data-testid="create-post-attach-button" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={openAttachmentPicker} aria-label={label('addImage')} title={label('addImage')}>
                  <Paperclip className="w-[18px] h-[18px]" />
                </Button>

                <Popover open={showLinkOpen} onOpenChange={setShowLinkOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" data-testid="create-post-link-button" className="h-9 w-9 text-primary hover:bg-primary/10" aria-label={label('addLink')} title={label('addLink')}>
                      <Link2 className="w-[18px] h-[18px]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn('w-80 rounded-xl border-border shadow-lg', popoverZClass)}
                    align="start"
                    side={isModal ? 'top' : 'bottom'}
                    sideOffset={8}
                    collisionPadding={isModal ? 16 : 8}
                  >
                    <div className="flex items-center gap-2 pb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-foreground"><LangText path="feed.addLink"  /></p>
                    </div>
                    <Input
                      placeholder={toastT('posts.paste_or_type_url')}
                      aria-label={toastT('posts.link_url')}
                      data-testid="create-post-link-input"
                      value={linkDraft}
                      onChange={(e) => setLinkDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setLinkUrl(linkDraft.trim());
                          setShowLinkOpen(false);
                        }
                      }}
                      className="rounded-lg border-border bg-background"
                    />
                    <Button
                      type="button"
                      size="sm"
                      data-testid="create-post-save-link-button"
                      className="mt-3 w-full rounded-lg"
                      onClick={() => {
                        setLinkUrl(linkDraft.trim());
                        setShowLinkOpen(false);
                      }}
                    >
                      <LangText path="feed.addLink"  />
                    </Button>
                  </PopoverContent>
                </Popover>

                {!showPollEditor ? (
                  <Button type="button" variant="ghost" size="icon" data-testid="create-post-poll-button" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={addPoll} aria-label={label('createPoll')} title={label('createPoll')}>
                    <BarChart3 className="w-[18px] h-[18px]" />
                  </Button>
                ) : null}

                <Popover open={showLocationOpen} onOpenChange={handleLocationPopoverOpenChange}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" data-testid="create-post-location-button" className="h-9 w-9 text-primary hover:bg-primary/10" aria-label={label('addLocation')} title={label('addLocation')}>
                      <MapPin className="w-[18px] h-[18px]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn('w-96 max-h-[min(65dvh,400px)] overflow-y-auto overflow-x-visible rounded-xl border-border shadow-lg', popoverZClass)}
                    align="start"
                    side={isModal ? 'top' : 'bottom'}
                    sideOffset={8}
                    collisionPadding={isModal ? 16 : 8}
                    {...getLocationPopoverDismissHandlers()}
                  >
                    <div className="flex items-center gap-2 pb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-foreground"><LangText path="feed.addLocation"  /></p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start gap-2 mb-3"
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                    >
                      {locationLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                      <LangText path={locationLoading ? 'feed.gettingLocation' : 'feed.useCurrentLocation'} />
                    </Button>
                    <LocationPicker
                      ref={locationPickerRef}
                      value={locationDraft}
                      onChange={(v) => setLocationDraft(v)}
                      onSelect={handleLocationSelect}
                      placeholder={toastT('posts.city_address_or_place_name')}
                      data-testid="create-post-location-input"
                      showMapsButton
                      showCurrentLocation={false}
                      suggestionsInPortal
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3 w-full rounded-lg"
                      onClick={() => {
                        void confirmLocationFromPicker(locationPickerRef);
                      }}
                    >
                      <LangText path="feed.addLocation"  />
                    </Button>
                  </PopoverContent>
                </Popover>

                <Popover open={showEmojiOpen} onOpenChange={setShowEmojiOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" aria-label={label('addEmoji')} title={label('addEmoji')}>
                      <Smile className="w-[18px] h-[18px]" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={cn('w-64 p-2', popoverZClass)} align="start">
                    <div className="grid grid-cols-5 gap-1">
                      {EMOJI_LIST.map((em, i) => (
                        <button
                          type="button"
                          key={i}
                          className="text-xl p-1 rounded hover:bg-muted"
                          onClick={() => insertEmoji(em)}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3">
                {content.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5">
                      <svg className="w-5 h-5 -rotate-90">
                        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                        <circle
                          cx="10" cy="10" r="8"
                          fill="none" stroke="currentColor" strokeWidth="2"
                          strokeDasharray={`${charPercentage * 0.5} 50`}
                          className={cn(isOverLimit ? 'text-destructive' : 'text-primary')}
                        />
                      </svg>
                    </div>
                    {charCount > MAX_LENGTH * 0.8 && (
                      <span className={cn('text-xs', isOverLimit ? 'text-destructive' : 'text-muted-foreground')}>
                        {MAX_LENGTH - charCount}
                      </span>
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  disabled={!canSubmit}
                  size="sm"
                  data-testid="create-post-submit-button"
                  className="gap-1.5 px-4 shadow-soft"
                  onClick={handleSubmit}
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? t(language, 'common.publishing') : t(language, 'common.publish')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ImageCropFlow cropper={cropper} />
    </form>
  );
}
