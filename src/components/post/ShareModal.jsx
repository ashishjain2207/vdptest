import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@imriva/framework';
import { Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { LangText } from '@/components/ui/LangText';
import { useT } from '@/i18n';
import { postPath } from '@/lib/appRoutes';

/**
 * Share modal with options: Copy link, Share via apps (Web Share API).
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, post: object }} props
 */
export function ShareModal({ open, onOpenChange, post }) {
  const t = useT();
  const postId = post?.id ?? post?.Id;
  const shareUrl = postId ? `${window.location.origin}${postPath(postId)}` : '';
  const rawContent = typeof post?.content === 'string' ? post.content.trim() : '';
  const shareTitle = rawContent.length > 60 ? `${rawContent.slice(0, 60)}…` : (rawContent || 'Check out this post');

  /** Strip control / zero-width chars that can make Windows share targets drop the body. */
  const sanitizeShareText = (s) =>
    String(s ?? '')
      .split('')
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return (code >= 0x20 && code !== 0x7F) || code === 0x09 || code === 0x0A || code === 0x0D;
      })
      .join('')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

  /**
   * Teams and other targets expect a canonical absolute URL; prefer `https` on
   * public hosts so `navigator.share({ url })` is accepted as a valid link.
   */
  const normalizeHttpsShareUrl = (absoluteUrl) => {
    if (!absoluteUrl) {
      return '';
    }
    try {
      const u = new URL(absoluteUrl);
      const isLocal =
        u.hostname === 'localhost' ||
        u.hostname === '127.0.0.1' ||
        u.hostname === '[::1]';
      if (u.protocol === 'http:' && !isLocal) {
        u.protocol = 'https:';
      }
      return u.toString();
    } catch {
      return '';
    }
  };

  /**
   * Web Share API payload for app targets (incl. Microsoft Teams on Windows).
   * - Windows often requires both `title` and `url` for the share sheet to behave.
   * - Teams frequently maps `title` into the chat compose; include the full https
   *   URL in `title` as well as `text` so the message is never blank when `text` is ignored.
   */
  const buildWebSharePayload = () => {
    const url = normalizeHttpsShareUrl(shareUrl);
    if (!url) {
      return { title: '', text: '', url: '' };
    }
    const snippet = sanitizeShareText(shareTitle) || 'Check out this post';
    const text = `${snippet}\n\n${url}`.trim().slice(0, 2000);
    // Put URL first so a short OS/Teams title cap cannot truncate away the link.
    const MAX_TITLE = 320;
    let title = `${url} — ${snippet}`;
    if (title.length > MAX_TITLE) {
      const room = Math.max(0, MAX_TITLE - url.length - 3);
      title = `${url} — ${snippet.slice(0, room)}…`;
    }
    return { title, text, url };
  };
  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.error(t('toasts.couldNotBuildPostLink'));
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('toasts.linkCopiedToClipboard'));
      onOpenChange(false);
    } catch {
      toast.error(t('toasts.couldNotCopyLink'));
    }
  };

  const handleShareViaApps = async () => {
    if (!shareUrl) {
      toast.error(t('toasts.couldNotBuildPostLink'));
      return;
    }
    if (navigator.share) {
      const payload = buildWebSharePayload();
      if (!payload.url || !payload.title) {
        toast.error(t('toasts.couldNotBuildPostLink'));
        return;
      }
      try {
        await navigator.share(payload);
        // Do not toast "success" here: many targets (e.g. Teams) resolve the
        // promise when the sheet hands off, even if the user backs out or the
        // target opens with no visible message — that produced false positives.
        onOpenChange(false);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          toast.error(t('toasts.shareFailed'));
        }
      }
    } else {
      await handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle><LangText path="posts.share_post"  /></DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={handleCopyLink}
          >
            <Link2 className="w-5 h-5" />
            <LangText path="posts.copy_link"  />
          </Button>
          {navigator.share && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleShareViaApps}
            >
              <Share2 className="w-5 h-5" />
              <LangText path="posts.share_via_apps"  />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
