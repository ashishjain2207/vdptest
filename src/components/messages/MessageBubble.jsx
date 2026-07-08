import { useState } from 'react';
import { Button, Textarea } from '@imriva/framework';
import {
  MoreVertical,
  Smile,
  Plus,
  Pencil,
  Trash2,
  Reply,
  Share2,
  Forward,
  Copy,
  Download,
  Info,
  Check,
  CheckCheck,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { PostContent } from '@/components/post/PostContent';
import { LangText } from '@/components/ui/LangText';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatMessageTime, formatMessageDateTime } from '@/lib/messageTimeUtils';
import { QUICK_REACTION_EMOJIS, EXTENDED_REACTION_EMOJIS, getMediaFileBlob } from '@/services/messageService';
import { ModerationAlert } from '@/components/common/ModerationAlert';

/** Professional emojis: like, dislike, claps, sad, smile */
const EMOJI_LABEL_KEYS = {
  '👍': 'messages_ui.reactionLike',
  '👎': 'messages_ui.reactionDislike',
  '👏': 'messages_ui.reactionClaps',
  '😢': 'messages_ui.reactionSad',
  '😊': 'messages_ui.reactionSmile',
};

export function MessageBubble({
  msg,
  replyToMessage,
  isMe,
  isUnread,
  isEditing,
  editContent,
  setEditContent,
  editErrorMessage,
  onDismissEditError,
  editingSubmitting,
  isDeleting,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  onReply,
  onCopy,
  onForward,
  onShare,
}) {
  const { language } = useLanguage();
  const t = useT();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiPickerExpanded, setEmojiPickerExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imagePreviewMediaFileId, setImagePreviewMediaFileId] = useState(null);
  const [imageEmojiPickerOpen, setImageEmojiPickerOpen] = useState(false);
  const [imageEmojiPickerExpanded, setImageEmojiPickerExpanded] = useState(false);
  const reactions = msg.reactions ?? [];

  const handleCopy = () => {
    const text = msg.content || '';
    if (text) {
      navigator.clipboard.writeText(text);
    }
    onCopy?.();
  };

  const handleImageClick = (url, mediaFileId) => {
    setImagePreviewUrl(url);
    setImagePreviewMediaFileId(mediaFileId ?? null);
    setImagePreviewOpen(true);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) { return ''; }
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadDocument = async (att) => {
    const url = att.url;
    const mediaFileId = att.mediaFileId ?? att.MediaFileId;
    const fileName = att.fileName || att.FileName || 'document';
    const triggerDownload = (blob, name) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(t('messages.downloaded'), { duration: 1500 });
    };
    if (mediaFileId) {
      try {
        const blob = await getMediaFileBlob(mediaFileId);
        triggerDownload(blob, fileName);
      } catch {
        window.open(url, '_blank');
      }
    } else if (url) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        triggerDownload(blob, fileName);
      } catch {
        window.open(url, '_blank');
      }
    }
  };

  const getImageFileName = (url) => {
    try {
      const path = new URL(url).pathname;
      const name = path.split('/').filter(Boolean).pop() || 'image.jpg';
      return name;
    } catch {
      return 'image.jpg';
    }
  };

  const downloadImage = async (url, mediaFileId) => {
    if (!url && !mediaFileId) {return;}

    const triggerDownload = (blob, fileName) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName || getImageFileName(url) || 'image.jpg';
      a.click();
      URL.revokeObjectURL(objectUrl);
      toast.success(t('messages.image_downloaded'), { duration: 1500 });
    };

    if (mediaFileId) {
      try {
        const blob = await getMediaFileBlob(mediaFileId);
        triggerDownload(blob, getImageFileName(url));
      } catch {
        toast.error(t('messages_ui.downloadFailed'));
      }
      return;
    }

    if (url) {
      try {
        const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) {throw new Error('Fetch failed');}
        const blob = await res.blob();
        triggerDownload(blob, getImageFileName(url));
      } catch {
        toast.error(t('messages.unable_to_download_image'));
      }
    }
  };

  const handleShareImage = async () => {
    if (!imagePreviewUrl) {return;}
    if (navigator.share) {
      try {
        const res = await fetch(imagePreviewUrl, { mode: 'cors' });
        const blob = await res.blob();
        const file = new File([blob], 'image.png', { type: blob.type });
        await navigator.share({
          files: [file],
          title: t('messages.message_image'),
        });
        toast.success(t('messages.shared_successfully'), { duration: 1500 });
      } catch (err) {
        if (err.name !== 'AbortError') {
          try {
            await navigator.share({
              url: imagePreviewUrl,
              title: t('messages.message_image'),
            });
            toast.success(t('messages.shared_successfully'), { duration: 1500 });
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') {
              navigator.clipboard.writeText(imagePreviewUrl);
              toast.success(t('messages.image_link_copied'), { duration: 1500 });
            }
          }
        }
      }
    } else {
      navigator.clipboard.writeText(imagePreviewUrl);
      toast.success(t('messages.image_link_copied'), { duration: 1500 });
    }
  };

  const EmojiButton = () => (
    <Popover
      open={emojiPickerOpen}
      onOpenChange={(open) => {
        setEmojiPickerOpen(open);
        if (!open) {setEmojiPickerExpanded(false);}
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 shrink-0 opacity-0 group-hover/message:opacity-60 hover:opacity-100 transition-opacity',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label={t('messages.add_reaction')}
        >
          <Smile className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align={isMe ? 'start' : 'end'}>
        {!emojiPickerExpanded ? (
          <div className="flex items-center gap-1">
            {QUICK_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-lg transition-colors"
                title={EMOJI_LABEL_KEYS[emoji] ? t(EMOJI_LABEL_KEYS[emoji]) : undefined}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onReact?.(msg.id, emoji);
                  setEmojiPickerOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-dashed border-muted-foreground/30"
              title={t('messages.more_emojis')}
              onClick={() => setEmojiPickerExpanded(true)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <LangText path="messages.pick_a_reaction"  />
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs"
                onClick={() => setEmojiPickerExpanded(false)}
              >
                <LangText path="layout.back"  />
              </Button>
            </div>
            <div className="max-h-[200px] overflow-y-auto grid grid-cols-8 gap-0.5">
              {EXTENDED_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-base transition-colors"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReact?.(msg.id, emoji);
                    setEmojiPickerOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );

  return (
    <div className={cn('flex flex-col group/message', isMe ? 'items-end' : 'items-start')}>
      {/* Bubble + emoji in same row - emoji beside the message bubble with spacing from Open/Download */}
      <div className={cn('flex items-center gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
        <div
          className={cn(
            'max-w-[75%] min-w-0 rounded-2xl px-4 py-2 overflow-hidden',
            isMe
              ? 'bg-primary text-primary-foreground'
              : isUnread
                ? 'bg-primary/15 border border-primary/30'
                : 'bg-card border border-border',
          )}
        >
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                className="min-h-[60px] text-sm resize-y w-full bg-background text-foreground"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              {editErrorMessage ? (
                <ModerationAlert
                  title="Message not updated"
                  message={editErrorMessage}
                  onDismiss={onDismissEditError}
                />
              ) : null}
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(isMe ? 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20' : '')}
                  onClick={onCancelEdit}
                  disabled={editingSubmitting}
                >
                  <LangText path="common.cancel"  />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  disabled={!editContent?.trim() || editContent?.trim() === (msg.content || '') || editingSubmitting}
                  onClick={() => onSaveEdit(msg.id, editContent)}
                >
                  {editingSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking and sending...</span>
                    </>
                  ) : <LangText path="messages.save"  />}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {replyToMessage && (
                <div className={cn('mb-2 pl-2 border-l-2', isMe ? 'border-primary-foreground/40' : 'border-border')}>
                  <p className="text-xs opacity-80 truncate max-w-[200px]">
                    {replyToMessage.content?.slice(0, 60)}{(replyToMessage.content?.length ?? 0) > 60 ? '...' : ''}
                  </p>
                </div>
              )}
              {(msg.attachments?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-3 mb-2">
                  {msg.attachments.map((att, i) => {
                    const isImage = att.contentType?.startsWith('image/');
                    return (
                      <div key={i} className="relative">
                        {isImage ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageClick(att.url, att.mediaFileId ?? att.MediaFileId);
                            }}
                            className="block rounded-lg overflow-hidden border border-border max-w-[200px] cursor-pointer hover:opacity-95 transition-opacity text-left"
                          >
                            <img
                              src={att.url}
                              alt={att.fileName || 'Attachment'}
                              className="max-h-40 object-cover"
                            />
                          </button>
                        ) : (
                          <div
                            className="flex items-center gap-3 min-w-0 max-w-full w-full py-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={cn(
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                              isMe ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary',
                            )}>
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <p className={cn('text-sm font-medium truncate', isMe ? 'text-primary-foreground' : 'text-foreground')}>
                                {att.fileName || att.FileName || 'Document'}
                              </p>
                              {typeof (att.fileSize ?? att.FileSize) === 'number' && (
                                <p className={cn('text-xs', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                  {formatFileSize(att.fileSize ?? att.FileSize)}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  'inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors',
                                  isMe ? 'text-primary-foreground/90 hover:bg-primary-foreground/20 hover:text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                                title={t('messages.open')}
                                aria-label={t('messages.open_attachment')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => downloadDocument(att)}
                                className={cn(
                                  'inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors',
                                  isMe ? 'text-primary-foreground/90 hover:bg-primary-foreground/20 hover:text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                                title={t('messages.download')}
                                aria-label={t('messages.download_attachment')}
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {msg.content && (
                <PostContent content={msg.content} className="text-sm whitespace-pre-wrap break-words [&>p]:whitespace-pre-wrap [&>p]:break-words" />
              )}
            </>
          )}
        </div>
        {!isEditing && <EmojiButton />}
      </div>

      {/* Timestamp, read status, 3 dots - row below (no emoji here) */}
      {!isEditing && (
        <div className={cn(
          'flex items-center gap-1 mt-0.5',
          isMe ? 'justify-end' : 'justify-start',
        )}>
          {msg.isEdited && (
            <span className="text-xs italic text-muted-foreground">
              ({t('messages.edited')})
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(msg.editedAt || msg.createdAt)}
          </span>
          {isMe && (
            <span className="flex-shrink-0 text-muted-foreground" title={msg.isRead ? (t('messages.read')) : (t('messages.sent'))}>
              {msg.isRead ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-6 w-6 shrink-0 opacity-0 group-hover/message:opacity-60 hover:opacity-100 transition-opacity',
                  'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
                onClick={(e) => e.stopPropagation()}
                aria-label={t('messages.message_actions')}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onReply?.(msg)}>
                <Reply className="w-3.5 h-3.5 mr-2" />
                <LangText path="messages.reply"  />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onForward?.(msg)}>
                <Forward className="w-3.5 h-3.5 mr-2" />
                <LangText path="messages.forward"  />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare?.(msg)}>
                <Share2 className="w-3.5 h-3.5 mr-2" />
                <LangText path="messages.share"  />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                <LangText path="messages.copy"  />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setInfoOpen(true)}>
                <Info className="w-3.5 h-3.5 mr-2" />
                <LangText path="messages.info"  />
              </DropdownMenuItem>
              {isMe && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.(msg)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    <LangText path="messages.edit"  />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-2" />}
                    <LangText path="messages.delete"  />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Reactions - outside message bubble: sent=left, received=right */}
      {reactions.length > 0 && (
        <div className={cn('flex flex-wrap gap-1.5 mt-1', isMe ? 'justify-start' : 'justify-end')}>
          {reactions.map((r) => (
            <button
              key={r.emoji}
              type="button"
              onClick={() => (r.isCurrentUser ? onRemoveReaction?.(msg.id) : onReact?.(msg.id, r.emoji))}
              className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-sm transition-colors',
                r.isCurrentUser
                  ? 'bg-primary/20 ring-1 ring-primary/40'
                  : 'bg-muted/50 hover:bg-muted',
              )}
            >
              <span>{r.emoji}</span>
              {r.count > 1 && <span className="text-xs">{r.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Full screen image viewer - 3 dots menu with Info, Share, Forward. Reaction via emoji beside bubble. */}
      {imagePreviewOpen && imagePreviewUrl && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col bg-black/95 select-none"
          onClick={() => { setImagePreviewOpen(false); setImagePreviewUrl(null); setImagePreviewMediaFileId(null); }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t('messages.image_actions')}
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[10010]" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => downloadImage(imagePreviewUrl, imagePreviewMediaFileId)}>
                  <Download className="w-3.5 h-3.5 mr-2" />
                  <LangText path="messages.download"  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setImagePreviewOpen(false); setInfoOpen(true); }}>
                  <Info className="w-3.5 h-3.5 mr-2" />
                  <LangText path="messages.info"  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShareImage()}>
                  <Share2 className="w-3.5 h-3.5 mr-2" />
                  <LangText path="messages.share"  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setImagePreviewOpen(false); onForward?.(msg); }}>
                  <Forward className="w-3.5 h-3.5 mr-2" />
                  <LangText path="messages.forward"  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => { e.stopPropagation(); setImagePreviewOpen(false); setImagePreviewUrl(null); setImagePreviewMediaFileId(null); }}
              aria-label={t('messages.close_image_preview')}
            >
              <span className="text-xl leading-none">&times;</span>
            </Button>
          </div>
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="group/preview relative inline-block max-w-full max-h-full">
              <img
                src={imagePreviewUrl}
                alt=""
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Emoji overlay on hover - only in full-screen image view */}
              <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-center gap-1.5 rounded-xl bg-black/50 px-3 py-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  {QUICK_REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 text-xl transition-colors"
                      title={EMOJI_LABEL_KEYS[emoji] ? t(EMOJI_LABEL_KEYS[emoji]) : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact?.(msg.id, emoji);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  <Popover
                    open={imageEmojiPickerOpen}
                    onOpenChange={(open) => {
                      setImageEmojiPickerOpen(open);
                      if (!open) {setImageEmojiPickerExpanded(false);}
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors border border-dashed border-white/40"
                        title={t('messages.more_emojis')}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t('messages.more_reactions')}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 z-[10010]" align="center" onClick={(e) => e.stopPropagation()}>
                      {!imageEmojiPickerExpanded ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {QUICK_REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-lg transition-colors"
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onReact?.(msg.id, emoji);
                                setImageEmojiPickerOpen(false);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors border border-dashed border-muted-foreground/30"
                            onClick={() => setImageEmojiPickerExpanded(true)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              <LangText path="messages.pick_a_reaction"  />
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-xs"
                              onClick={() => setImageEmojiPickerExpanded(false)}
                            >
                              <LangText path="layout.back"  />
                            </Button>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto grid grid-cols-8 gap-0.5">
                            {EXTENDED_REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-base transition-colors"
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onReact?.(msg.id, emoji);
                                  setImageEmojiPickerOpen(false);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info dialog - sent/read timings */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle><LangText path="messages.message_info"  /></DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t('messages.sent')}: </span>
              {formatMessageDateTime(msg.createdAt, { language })}
              {msg.editedAt && (
                <span className="text-muted-foreground ml-1">
                  ({t('messages.edited')} {formatMessageDateTime(msg.editedAt, { language })})
                </span>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t('messages.read')}:{' '}
              </span>
              {msg.isRead
                ? (msg.readAt ? formatMessageDateTime(msg.readAt, { language }) : (t('messages.read')))
                : (t('messages.unread'))}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle><LangText path="messages.delete_message"  /></AlertDialogTitle>
            <AlertDialogDescription>
              <LangText path="messages.this_action_cannot_be_undone_the_message_will_be_permanently"  />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel><LangText path="common.cancel"  /></AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(msg.id)}
            >
              <LangText path="messages.delete"  />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
