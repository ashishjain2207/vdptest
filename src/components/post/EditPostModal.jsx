import { useState, useEffect, useRef } from 'react';
import { useMentionSuggestions } from '@/hooks/useMentionSuggestions';
import { Button, Textarea } from '@imriva/framework';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Paperclip, FileText, Link2, MapPin, BarChart3, X, Loader2, Navigation } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { LocationPicker, getCurrentLocationAndAddress, getLocationPopoverDismissHandlers } from '@/components/ui/LocationPicker';
import { useLocationAttachmentPopover } from '@/hooks/useLocationAttachmentPopover';
import { toast } from 'sonner';
import { parsePostContent, buildPostContent, resolveLocationForPublish } from '@/lib/postContent';
import { canPublishPostComposer } from '@/lib/postComposer';
import { MAX_POLL_OPTIONS } from '@/lib/pollLimits';
import {
  updatePost,
  updatePostHashtags,
  removeMediaFromPost,
  updatePoll,
  deletePoll,
  createPoll,
  getPostById,
} from '@/services/postService';
import { prepareFilesForPostMultipart } from '@/services/mediaService.js';
import { LangText } from '@/components/ui/LangText';
import { cn } from '@/lib/utils';
import { dispatchFeedEvent, FEED_EVENTS } from '@/lib/feedEvents';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT, useTParams, resolveLocalizedMessage } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { postMediaKindFromApiType } from '@/lib/postMedia';
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
const POST_EDIT_MODERATION_FALLBACK = 'This post couldn’t be updated because it may violate platform rules. Please edit the content and try again.';

function getLinkDomain(url) {
  try {
    const u = new URL(url.trim().startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.trim().slice(0, 32);
  }
}

export function EditPostModal({ open, onOpenChange, post, onPostUpdated }) {
  const { language } = useLanguage();
  const t = useT();
  const tr = useTParams();
  const { user: authUser } = useAuth();
  const [mainText, setMainText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [location, setLocation] = useState('');
  const [linkDraft, setLinkDraft] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const [showLinkOpen, setShowLinkOpen] = useState(false);
  const [showLocationOpen, setShowLocationOpen] = useState(false);
  const [existingMedia, setExistingMedia] = useState(/** @type {{ mediaFileId: string, url: string, mediaType?: string }[]} */ ([]));
  const [mediaToRemove, setMediaToRemove] = useState(/** @type {Set<string>} */ (new Set()));
  const [selectedFiles, setSelectedFiles] = useState(/** @type {File[]} */ ([]));
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionTexts, setPollOptionTexts] = useState(/** @type {string[]} */ (['', '']));
  const [pollToRemove, setPollToRemove] = useState(false);
  const [showAddPoll, setShowAddPoll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationError, setModerationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [uploadPolicy, setUploadPolicy] = useState(null);
  const [uploadAccept, setUploadAccept] = useState('image/*');
  const { cropper, enqueue: enqueueImageCrop } = useImageCropQueue();
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const mainTextRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const locationPickerRef = useRef(/** @type {{ confirmSelection?: () => { committed: boolean, value: string } } | null} */ (null));
  const { handleChange: handleMentionChange, handleKeyDown: handleMentionKeyDown, handleBlur: handleMentionBlur, MentionDropdown } = useMentionSuggestions({
    content: mainText,
    setContent: setMainText,
    inputRef: mainTextRef,
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

  useEffect(() => {
    if (post && open) {
      const parsed = parsePostContent(post.content ?? '');
      setMainText(parsed.mainText);
      setLinkUrl(parsed.linkUrl);
      setLocation(parsed.location);
      setLocationDraft(parsed.location);
      const media = post.media ?? post.Media ?? post.mediaUrls ?? [];
      const mediaList = Array.isArray(media)
        ? media.map((m) => ({
          mediaFileId: (m.mediaFileId ?? m.MediaFileId ?? m.id ?? m.Id)?.toString?.() ?? '',
          url: m.url ?? m.Url ?? (typeof m === 'string' ? m : ''),
          mediaType: m.mediaType ?? m.MediaType ?? 'Image',
        }))
        : [];
      setExistingMedia(mediaList.filter((m) => m.mediaFileId && m.url));
      setMediaToRemove(new Set());
      setSelectedFiles([]);
      const p = post.poll ?? post.Poll;
      const opts = p?.options ?? p?.Options ?? [];
      setPollQuestion(p?.question ?? p?.Question ?? '');
      setPollOptionTexts(
        opts.length >= 2
          ? opts.map((o) => (o.text ?? o.Text ?? ''))
          : ['', ''],
      );
      setPollToRemove(false);
      setShowAddPoll(false);
      setModerationError('');
    }
  }, [post, open]);

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
    const keptExisting = existingMedia.length - mediaToRemove.size;
    const maxNewTotal = Math.max(0, MAX_MEDIA - keptExisting);
    const { next, errors } = mergeValidatedPostMediaFiles(files, selectedFiles, maxNewTotal, uploadPolicy);
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
    const existingImageCount =
      existingMedia.filter(
        (m) => !mediaToRemove.has(m.mediaFileId) && postMediaKindFromApiType(m.mediaType) === 'image',
      ).length +
      selectedFiles.filter((f) => f.type.startsWith('image/')).length;
    const { rasterItems, passthrough } = buildPostImageCropQueue(
      picked,
      selectedFiles,
      language,
      existingImageCount,
    );
    if (!rasterItems.length) {
      applyMergedFiles(passthrough);
      return;
    }
    enqueueImageCrop(rasterItems, (cropped) => {
      applyMergedFiles([...passthrough, ...cropped]);
    });
  };

  const removeNewFile = (index) => {
    clearModerationError();
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (mediaFileId) => {
    clearModerationError();
    setMediaToRemove((prev) => new Set(prev).add(mediaFileId));
  };

  const undoRemoveMedia = (mediaFileId) => {
    clearModerationError();
    setMediaToRemove((prev) => {
      const next = new Set(prev);
      next.delete(mediaFileId);
      return next;
    });
  };

  const poll = post?.poll ?? post?.Poll;
  const hasPoll = poll !== null && poll !== undefined && !pollToRemove;
  const pollId =
    (post?.poll ?? post?.Poll)?.id ??
    (post?.poll ?? post?.Poll)?.Id ??
    (post?.poll ?? post?.Poll)?.pollId ??
    (post?.poll ?? post?.Poll)?.PollId;

  const committedLocation = location.trim();
  const locationForPublish = () =>
    resolveLocationForPublish({
      location,
      locationDraft,
      locationPopoverOpen: showLocationOpen,
      confirmPickerSelection: () => locationPickerRef.current?.confirmSelection?.(),
    });

  const handleSubmit = async () => {
    if (!post?.id) {return;}

    const savedLocation = locationForPublish();
    const content = buildPostContent({ mainText, linkUrl, location: savedLocation });
    const mediaCount = existingMedia.length - mediaToRemove.size + selectedFiles.length;
    const newPollReady =
      !hasPoll &&
      !pollToRemove &&
      Boolean(pollQuestion.trim()) &&
      pollOptionTexts.filter((t) => String(t ?? '').trim()).length >= 2;
    if (
      !content.trim() &&
      mediaCount === 0 &&
      !newPollReady &&
      !(hasPoll && !pollToRemove)
    ) {
      toast.error(
        language === 'EN'
          ? 'Add text, media, link, location, or a poll — or keep an existing poll.'
          : 'Text, Medien, Link, Standort oder Umfrage hinzufügen — oder bestehende Umfrage beibehalten.',
      );
      return;
    }

    const charCount = content.length;
    if (charCount > MAX_LENGTH) {
      toast.error(tr('validation.contentExceedsMax', { n: MAX_LENGTH }));
      return;
    }

    setIsSubmitting(true);
    try {
      setModerationError('');
      const formData = new FormData();
      formData.append('content', content.trim() || ' ');
      formData.append('postType', post.postType ?? post.PostType ?? 'Post');
      const preparedFiles = await prepareFilesForPostMultipart(selectedFiles);
      preparedFiles.forEach((f) => formData.append('files', f));

      // Send current hashtags from content so backend can sync: deactivate removed, add new (e.g. #divya → #navya).
      const hashtags = [...new Set((content.match(/#[\w]+/g) || []).map((t) => t.slice(1).toLowerCase()))];
      formData.append('hashtags', JSON.stringify(hashtags));

      const updated = await updatePost(post.id, formData);

      // Explicitly sync hashtags so removed tags get IsActive = 0 and new tags get active mappings (search reflects edit).
      try {
        await updatePostHashtags(post.id, hashtags);
      } catch (err) {
        toast.error(err?.message || 'Failed to update hashtags');
      }

      for (const mediaFileId of mediaToRemove) {
        try {
          await removeMediaFromPost(post.id, mediaFileId);
        } catch (err) {
          toast.error(err?.message || 'Failed to remove media');
        }
      }

      if (hasPoll && pollId) {
        const newQuestion = pollQuestion.trim();
        if (newQuestion) {
          try {
            await updatePoll(pollId, { question: newQuestion });
          } catch (err) {
            toast.error(err?.message || 'Failed to update poll');
          }
        }
      } else if (pollToRemove && pollId) {
        try {
          await deletePoll(pollId);
        } catch (err) {
          toast.error(err?.message || 'Failed to remove poll');
        }
      } else if (!hasPoll && pollQuestion.trim()) {
        const opts = pollOptionTexts.filter(Boolean);
        if (opts.length < 2) {
          toast.error(t('posts.poll_needs_at_least_2_options'));
          setIsSubmitting(false);
          return;
        }
        try {
          await createPoll(post.id, {
            question: pollQuestion.trim(),
            optionTexts: opts,
          });
        } catch (err) {
          toast.error(err?.message || 'Failed to add poll');
        }
      }

      // Poll/create/delete run after updatePost; refetch so clients get Poll + media + hashtags in one DTO.
      let postForClients = updated;
      try {
        const fresh = await getPostById(post.id);
        if (fresh) {
          postForClients = fresh;
        }
      } catch {
        /* keep updated from PUT */
      }

      toast.success(t('posts.post_updated'));
      onPostUpdated?.(postForClients);
      dispatchFeedEvent(FEED_EVENTS.POST_UPDATED, { post: postForClients });
      onOpenChange(false);
    } catch (err) {
      if (isModerationError(err)) {
        setModerationError(getModerationErrorMessage(err, POST_EDIT_MODERATION_FALLBACK));
        return;
      }
      toast.error(err?.message || 'Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = buildPostContent({ mainText, linkUrl, location: committedLocation });
  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const mediaCount = existingMedia.length - mediaToRemove.size + selectedFiles.length;
  const pollDraftForComposer =
    !hasPoll && !pollToRemove && (pollQuestion.trim() || pollOptionTexts.some((t) => String(t ?? '').trim()))
      ? { question: pollQuestion, optionTexts: pollOptionTexts }
      : null;
  const canSubmit =
    (canPublishPostComposer({
      content: mainText,
      selectedFiles,
      linkUrl,
      location: committedLocation || (showLocationOpen ? locationDraft.trim() : ''),
      poll: pollDraftForComposer,
    }) ||
      mediaCount > 0 ||
      (hasPoll && !pollToRemove)) &&
    !isOverLimit &&
    !isSubmitting;

  const visibleMedia = existingMedia.filter((m) => !mediaToRemove.has(m.mediaFileId));
  const canAddMoreMedia =
    visibleMedia.length + selectedFiles.length < MAX_MEDIA;

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
        toast.error(t('toasts.locationDenied'), { duration: 6000 });
      } else if (code === 2) {
        toast.error(t('toasts.locationUnavailable'), { duration: 5000 });
      } else if (code === 3) {
        toast.error(t('toasts.locationTimeout'), { duration: 5000 });
      } else {
        toast.error(err?.message || t('toasts.locationGetFailed'), { duration: 5000 });
      }
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0 border-b border-border">
          <DialogTitle><LangText path="posts.edit_post"  /></DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={uploadAccept}
            multiple
            className="hidden"
            aria-label={t('posts.add_attachments_to_post')}
            onChange={handleFileChange}
          />

          <div className="relative">
            <Textarea
              ref={mainTextRef}
              placeholder={
                language === 'EN'
                  ? 'What would you like to share?'
                  : 'Was möchten Sie teilen?'
              }
              aria-label={t('posts.post_content')}
              className="min-h-[120px] resize-none"
              value={mainText}
              onChange={(e) => {
                clearModerationError();
                handleMentionChange(e);
              }}
              onKeyDown={handleMentionKeyDown}
              onBlur={handleMentionBlur}
              maxLength={MAX_LENGTH + 1}
            />
            {MentionDropdown()}
          </div>

          {/* Existing media with remove */}
          {visibleMedia.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {visibleMedia.map((m) => {
                const kind = postMediaKindFromApiType(m.mediaType);
                return (
                  <div key={m.mediaFileId} className={cn('relative inline-block', (kind === 'audio' || kind === 'document') && 'align-top')}>
                    {kind === 'image' ? (
                      <img
                        src={m.url}
                        alt=""
                        className="h-20 w-20 rounded-lg object-cover border border-border"
                      />
                    ) : kind === 'video' ? (
                      <video
                        src={m.url}
                        className="h-20 w-20 rounded-lg object-cover border border-border bg-black"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : kind === 'audio' ? (
                      <div className="h-20 w-32 rounded-lg border border-border bg-muted/80 flex items-center p-1">
                        <audio src={m.url} controls className="w-full h-8" preload="metadata" />
                      </div>
                    ) : (
                      <div className="h-20 min-w-[120px] max-w-[180px] rounded-lg border border-border bg-muted/80 flex items-center gap-2 px-2">
                        <FileText className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                        <span className="text-[10px] text-muted-foreground line-clamp-2 break-all">File</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingMedia(m.mediaFileId)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                      aria-label={t('posts.remove_existing_media')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Media marked for removal (show with undo) */}
          {existingMedia.filter((m) => mediaToRemove.has(m.mediaFileId)).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              {existingMedia
                .filter((m) => mediaToRemove.has(m.mediaFileId))
                .map((m) => (
                  <div key={m.mediaFileId} className="flex items-center gap-1 rounded-lg border border-dashed border-muted-foreground/50 px-2 py-1">
                    <span className="text-xs text-muted-foreground">
                      <LangText path="posts.removed"  />
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => undoRemoveMedia(m.mediaFileId)}
                    >
                      <LangText path="posts.undo"  />
                    </Button>
                  </div>
                ))}
            </div>
          )}

          {/* New files preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, i) => (
                <LocalPostMediaFileThumb
                  key={`${file.name}-${file.size}-${i}`}
                  file={file}
                  onRemove={() => removeNewFile(i)}
                  removeAriaLabel={t('posts.remove')}
                />
              ))}
            </div>
          )}

          {/* Link attachment — above poll so link/location stay visible while editing polls */}
          {linkUrl.trim() && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Link2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  <LangText path="posts.link"  />
                </p>
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
                onClick={() => {
                  clearModerationError();
                  setLinkUrl('');
                }}
                className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Remove link"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Location attachment */}
          {!showLocationOpen && committedLocation && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  <LangText path="partners.location"  />
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  📍 {committedLocation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearModerationError();
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

          {/* Poll editor */}
          {(hasPoll || showAddPoll || pollQuestion.trim() || pollToRemove) && (
            <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30 space-y-2">
              <Input
                placeholder={
                  t('posts.ask_a_question')
                }
                aria-label={t('posts.poll_question')}
                value={pollQuestion}
                onChange={(e) => {
                  clearModerationError();
                  setPollQuestion(e.target.value);
                }}
                className="bg-background"
                disabled={pollToRemove}
              />
              {!hasPoll && (showAddPoll || pollQuestion.trim()) && (
                <div className="space-y-2">
                  {pollOptionTexts.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={tr('time.pollOption', { n: i + 1 })}
                        aria-label={tr('time.pollOptionAria', { n: i + 1 })}
                        value={opt}
                        onChange={(e) => {
                          clearModerationError();
                          const next = [...pollOptionTexts];
                          next[i] = e.target.value;
                          setPollOptionTexts(next);
                        }}
                        className="bg-background"
                      />
                      {pollOptionTexts.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            clearModerationError();
                            setPollOptionTexts((prev) => prev.filter((_, j) => j !== i));
                          }}
                          aria-label="Remove option"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pollOptionTexts.length < MAX_POLL_OPTIONS && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearModerationError();
                        setPollOptionTexts((prev) => [...prev, '']);
                      }}
                    >
                      <LangText path="posts.add_option"  />
                    </Button>
                  )}
                </div>
              )}
              {hasPoll ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearModerationError();
                    setPollToRemove(true);
                  }}
                >
                  <LangText path="posts.remove_poll"  />
                </Button>
              ) : (
                (showAddPoll || pollQuestion.trim()) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clearModerationError();
                      setShowAddPoll(false);
                      setPollQuestion('');
                      setPollOptionTexts(['', '']);
                    }}
                  >
                    <LangText path="posts.remove_poll"  />
                  </Button>
                )
              )}
            </div>
          )}

          {moderationError && (
            <div className="mt-3">
              <ModerationAlert
                title="Post not updated"
                message={moderationError}
                onDismiss={() => setModerationError('')}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {canAddMoreMedia && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                  onClick={openAttachmentPicker}
                  aria-label={t('posts.add_attachments_to_post')}
                  title={t('posts.add_attachments_to_post')}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
              )}

              <Popover open={showLinkOpen} onOpenChange={setShowLinkOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-primary hover:bg-primary/10"
                    aria-label="Add link"
                  >
                    <Link2 className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 max-h-[min(70vh,320px)] overflow-y-auto rounded-xl border-border shadow-lg"
                  align="start"
                  side="top"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <div className="flex items-center gap-2 pb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      <LangText path="feed.addLink"  />
                    </p>
                  </div>
                  <Input
                    placeholder={
                      t('posts.paste_or_type_url')
                    }
                    aria-label={t('posts.link_url')}
                    value={linkDraft}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        clearModerationError();
                        setLinkUrl(linkDraft.trim());
                        setShowLinkOpen(false);
                      }
                    }}
                    className="rounded-lg border-border bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 w-full rounded-lg"
                    onClick={() => {
                      clearModerationError();
                      setLinkUrl(linkDraft.trim());
                      setShowLinkOpen(false);
                    }}
                  >
                    <LangText path="feed.addLink"  />
                  </Button>
                </PopoverContent>
              </Popover>

              {!hasPoll && !showAddPoll && !pollQuestion.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                  onClick={() => {
                    clearModerationError();
                    setShowAddPoll(true);
                  }}
                  aria-label="Add poll"
                >
                  <BarChart3 className="w-5 h-5" />
                </Button>
              )}

              <Popover open={showLocationOpen} onOpenChange={handleLocationPopoverOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-primary hover:bg-primary/10"
                    aria-label="Add location"
                  >
                    <MapPin className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-96 max-h-[min(65dvh,400px)] overflow-y-auto overflow-x-visible rounded-xl border-border shadow-lg"
                  align="start"
                  side="top"
                  sideOffset={8}
                  collisionPadding={16}
                  {...getLocationPopoverDismissHandlers()}
                >
                  <div className="flex items-center gap-2 pb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      <LangText path="feed.addLocation"  />
                    </p>
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
                    placeholder={
                      language === 'EN'
                        ? 'City, address or place name...'
                        : 'Stadt, Adresse oder Ort...'
                    }
                    showMapsButton
                    showCurrentLocation={false}
                    suggestionsInPortal
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 w-full rounded-lg"
                    onClick={() => {
                      clearModerationError();
                      void confirmLocationFromPicker(locationPickerRef);
                    }}
                  >
                    <LangText path="feed.addLocation"  />
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={
                  isOverLimit ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'
                }
              >
                {charCount} / {MAX_LENGTH}
              </span>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {isSubmitting
                  ? language === 'EN'
                    ? 'Checking and publishing...'
                    : 'Wird geprüft und veröffentlicht...'
                  : language === 'EN'
                    ? 'Save'
                    : 'Speichern'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <ImageCropFlow cropper={cropper} />
    </Dialog>
  );
}
