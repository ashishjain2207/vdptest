import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { getUserMedia } from '@/services/postService';
import { Button } from '@imriva/framework';
import { ArrowLeft, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/i18n';
import { LangText } from '@/components/ui/LangText';
import { profilePath, postPath } from '@/lib/appRoutes';

const SWIPE_THRESHOLD_PX = 50;

/**
 * Viewer for all media uploaded by a user (from API user media).
 * URL: /user/:userId/media or /user/:userId/media/:mediaIndex
 * List order: images, then videos, then audio (same as Profile media tab). Navigate with arrows; "View full post" opens the post for the current item.
 */
const UserMediaViewer = () => {
  const { userId, mediaIndex: mediaIndexParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;
  const { language } = useLanguage();
  const t = useT();

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
    } else if (userId) {
      navigate(`${profilePath(userId)}?tab=media`);
    } else {
      navigate(-1);
    }
  };
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mediaIndex = mediaIndexParam !== null && mediaIndexParam !== ''
    ? Math.max(0, parseInt(mediaIndexParam, 10) || 0)
    : 0;

  const safeIndex = mediaList.length > 0 ? Math.min(mediaIndex, mediaList.length - 1) : 0;
  const currentItem = mediaList[safeIndex];
  const currentUrl = currentItem?.url ?? currentItem?.Url ?? null;
  const currentPostId = currentItem?.postId ?? currentItem?.PostId ?? null;

  const fetchUserMedia = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError(t('common.user_not_specified'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getUserMedia(userId);
      const images = Array.isArray(data?.images) ? data.images : [];
      const videos = Array.isArray(data?.videos) ? data.videos : [];
      const audio = Array.isArray(data?.audio) ? data.audio : [];
      // Order must match Profile media tab (images, then videos, then audio) so /user/:id/media/:index aligns.
      const list = [
        ...images.map((m) => ({ ...m, url: m.url ?? m.Url, type: 'image' })),
        ...videos.map((m) => ({ ...m, url: m.url ?? m.Url, type: 'video' })),
        ...audio.map((m) => ({ ...m, url: m.url ?? m.Url, type: 'audio' })),
      ].filter((m) => m.url);
      setMediaList(list);
      if (list.length === 0) {
        setError(t('common.no_media_yet'));
      }
    } catch (err) {
      setError(err?.message ?? (t('common.failed_to_load_media')));
      setMediaList([]);
    } finally {
      setLoading(false);
    }
  }, [userId, language]);

  useEffect(() => {
    fetchUserMedia();
  }, [fetchUserMedia]);

  useEffect(() => {
    if (loading || mediaList.length === 0) {return;}
    const idx = mediaIndexParam !== null && mediaIndexParam !== '' ? parseInt(mediaIndexParam, 10) : 0;
    if (Number.isNaN(idx) || idx < 0 || idx >= mediaList.length) {
      navigate(mediaList.length === 1 ? `/user/${userId}/media` : `/user/${userId}/media/${safeIndex}`, { replace: true });
    }
  }, [loading, mediaList.length, mediaIndexParam, safeIndex, userId, navigate]);

  const hasMultiple = mediaList.length > 1;
  const canGoPrev = hasMultiple && safeIndex > 0;
  const canGoNext = hasMultiple && safeIndex < mediaList.length - 1;

  const goPrev = () => {
    if (!canGoPrev) {return;}
    navigate(safeIndex - 1 === 0 ? `/user/${userId}/media` : `/user/${userId}/media/${safeIndex - 1}`);
  };

  const goNext = () => {
    if (!canGoNext) {return;}
    navigate(`/user/${userId}/media/${safeIndex + 1}`);
  };

  const touchStart = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e) => {
    if (!hasMultiple) {return;}
    const t = e.touches?.[0];
    if (t) {touchStart.current = { x: t.clientX, y: t.clientY };}
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
          <Button variant="ghost" size="icon" className="mb-4" onClick={handleBack} aria-label={t('layout.back')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleBack} aria-label={t('layout.back')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {hasMultiple && (
            <span className="text-sm text-muted-foreground">
              {safeIndex + 1} <LangText path="common.of"  /> {mediaList.length}
            </span>
          )}
        </div>

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
          aria-label={t('common.user_media_viewer')}
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

          <div className="w-full max-w-4xl aspect-square max-h-[70vh] flex items-center justify-center bg-muted">
            {currentItem?.type === 'video' ? (
              <video
                src={currentUrl}
                className="w-full h-full max-h-[70vh] object-contain"
                controls
                playsInline
              />
            ) : currentItem?.type === 'audio' ? (
              <audio
                src={currentUrl}
                className="w-full max-w-lg mx-4"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={currentUrl}
                alt=""
                className="w-full h-full max-h-[70vh] object-contain pointer-events-none"
                draggable={false}
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-4 p-4 w-full bg-muted/80">
            {hasMultiple && <span className="text-sm text-muted-foreground">{safeIndex + 1} / {mediaList.length}</span>}
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
            {currentPostId && (
              <Button variant="secondary" size="sm" onClick={() => navigate(postPath(currentPostId))}>
                <LangText path="common.view_full_post"  />
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserMediaViewer;
