import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { getPostMedia } from '@/services/postService';
import { Button } from '@imriva/framework';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { LangText } from '@/components/ui/LangText';
import { postMediaPath, postPath } from '@/lib/appRoutes';
import { postMediaKindFromApiType, postMediaKindFromUrl } from '@/lib/postMedia';

const SWIPE_THRESHOLD_PX = 50;

/**
 * Media-only viewer for a post's attachments (image, video, audio).
 * URL: /posts/:postId/media or /posts/:postId/media/:mediaIndex (legacy /media/post/... redirects here)
 * Shows one item at a time with prev/next arrows; URL updates as you navigate.
 */
const MediaViewer = () => {
  const { postId, mediaIndex: mediaIndexParam } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();

  const goToPost = () => (postId ? navigate(postPath(postId), { replace: true }) : navigate(-1));
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mediaIndex = mediaIndexParam !== null && mediaIndexParam !== ''
    ? Math.max(0, parseInt(mediaIndexParam, 10) || 0)
    : 0;

  const safeIndex = mediaList.length > 0 ? Math.min(mediaIndex, mediaList.length - 1) : 0;
  const current = mediaList[safeIndex];
  const currentUrl = current?.url ?? null;
  const currentKind = current?.kind ?? 'image';

  const fetchMedia = useCallback(async () => {
    if (!postId || !/^[0-9a-fA-F-]{36}$/.test(postId)) {
      setLoading(false);
      setError(t('common.invalid_post_id'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getPostMedia(postId);
      const items = Array.isArray(list)
        ? list
          .map((m) => {
            const url = m.url ?? m.Url ?? '';
            if (!url) {
              return null;
            }
            const mt = m.mediaType ?? m.MediaType;
            const kind = mt ? postMediaKindFromApiType(mt) : postMediaKindFromUrl(url);
            return { url, kind };
          })
          .filter(Boolean)
        : [];
      setMediaList(items);
      if (items.length === 0) {
        setError(t('common.no_media_in_this_post'));
      }
    } catch (err) {
      setError(err?.message ?? (t('common.failed_to_load_media')));
      setMediaList([]);
    } finally {
      setLoading(false);
    }
  }, [postId, language]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // If URL index is out of range after load, redirect to valid index
  useEffect(() => {
    if (loading || mediaList.length === 0) {return;}
    const idx = mediaIndexParam !== null && mediaIndexParam !== '' ? parseInt(mediaIndexParam, 10) : 0;
    if (Number.isNaN(idx) || idx < 0 || idx >= mediaList.length) {
      navigate(postMediaPath(postId, mediaList.length === 1 ? undefined : safeIndex), { replace: true });
    }
  }, [loading, mediaList.length, mediaIndexParam, safeIndex, postId, navigate]);

  const hasMultiple = mediaList.length > 1;
  const canGoPrev = hasMultiple && safeIndex > 0;
  const canGoNext = hasMultiple && safeIndex < mediaList.length - 1;

  const goPrev = () => {
    if (!canGoPrev) {return;}
    navigate(postMediaPath(postId, safeIndex - 1 === 0 ? undefined : safeIndex - 1));
  };

  const goNext = () => {
    if (!canGoNext) {return;}
    navigate(postMediaPath(postId, safeIndex + 1));
  };

  // Touch swipe: like mobile – swipe left = next, swipe right = prev
  const touchStart = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e) => {
    if (!hasMultiple) {return;}
    const t = e.touches?.[0];
    if (t) {
      touchStart.current = { x: t.clientX, y: t.clientY };
    }
  };
  const handleTouchEnd = (e) => {
    if (!hasMultiple) {return;}
    const t = e.changedTouches?.[0];
    if (!t) {return;}
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) {return;}
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx > 0 && canGoPrev) {goPrev();}
      else if (dx < 0 && canGoNext) {goNext();}
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground"><LangText path="common.loading_media"  /></p>
        </div>
      </MainLayout>
    );
  }

  if (error || mediaList.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <Button variant="ghost" size="icon" className="mb-4" onClick={goToPost} aria-label={t('common.back_to_post')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <p className="text-muted-foreground">{error || <><LangText path="common.no_media_in_this_post"  /></>}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Media viewer in main body only – sidebar and header stay visible; black bg for media area */}
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={goToPost}
            aria-label={t('layout.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {hasMultiple && (
            <span className="text-sm text-muted-foreground">
              {safeIndex + 1} <LangText path="common.of"  /> {mediaList.length}
            </span>
          )}
        </div>

        {/* Black-background media area – in body only, does not cover sidebar/header */}
        <div
          className="relative flex flex-col items-center justify-center rounded-xl overflow-hidden bg-muted"
          onKeyDown={(e) => {
            if (!hasMultiple) {return;}
            if (e.key === 'ArrowLeft') { e.preventDefault(); if (canGoPrev) {goPrev();} }
            if (e.key === 'ArrowRight') { e.preventDefault(); if (canGoNext) {goNext();} }
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          tabIndex={0}
          role="application"
          aria-label={t('common.media_viewer')}
        >
          {hasMultiple && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!canGoPrev}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 md:h-12 md:w-12 rounded-full bg-muted/80 text-foreground hover:bg-muted border-0 touch-manipulation disabled:opacity-40 disabled:pointer-events-none"
                onClick={goPrev}
                aria-label={t('admin.previous')}
              >
                <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!canGoNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 md:h-12 md:w-12 rounded-full bg-muted/80 text-foreground hover:bg-muted border-0 touch-manipulation disabled:opacity-40 disabled:pointer-events-none"
                onClick={goNext}
                aria-label={t('admin.next')}
              >
                <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
              </Button>
            </>
          )}

          <div className="w-full max-w-4xl min-h-[200px] max-h-[70vh] flex items-center justify-center bg-muted">
            {currentKind === 'video' && currentUrl ? (
              <video
                src={currentUrl}
                className="w-full max-h-[70vh] object-contain"
                controls
                playsInline
                preload="metadata"
              />
            ) : currentKind === 'audio' && currentUrl ? (
              <div className="w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
                <audio src={currentUrl} controls className="w-full" preload="metadata" />
              </div>
            ) : currentKind === 'document' && currentUrl ? (
              <div
                className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <FileText className="h-16 w-16 text-primary" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  <LangText path="common.preview_may_not_be_available_for_this_file_type"  />
                </p>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <LangText path="common.open_in_new_tab"  />
                </a>
              </div>
            ) : currentUrl ? (
              <img
                src={currentUrl}
                alt=""
                className="w-full h-full max-h-[70vh] object-contain pointer-events-none"
                draggable={false}
              />
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-4 p-4 w-full bg-muted/80">
            {hasMultiple && (
              <span className="text-sm text-muted-foreground">
                {safeIndex + 1} / {mediaList.length}
              </span>
            )}
            {currentUrl ? (
              <a
                href={currentUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Download className="w-4 h-4" />
                {t('messages.download')}
              </a>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(postPath(postId))}
            >
              <LangText path="common.view_full_post"  />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MediaViewer;
