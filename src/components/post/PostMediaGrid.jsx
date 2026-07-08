import { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { postMediaKindFromFile } from '@/lib/postMedia';
import { FramedImage } from '@/components/media/FramedImage';
import { getImageDisplayMetadataFromFile } from '@/lib/imageCropMetadata';
import { FEED_GRID_ASPECT_RATIO, FEED_WIDE_ASPECT_RATIO } from '@/lib/imageCropPresets';
import { LangText } from '@/components/ui/LangText';

/**
 * Renders post attachments in the feed (images, video, audio, documents).
 * @param {{
 *   items: Array<{ url: string, kind: import('@/lib/postMedia').PostMediaKind, imageVariantUrls?: Record<string, string> | null, imageDisplay?: import('@/lib/imageCropMetadata').ImageDisplayMetadata | null }>,
 *   layout?: 'single' | 'grid',
 *   className?: string,
 *   imgClassSingle?: string,
 * }} props
 */
export function PostMediaGrid({ items, layout = 'grid', className, imgClassSingle }) {
  if (!items?.length) {
    return null;
  }

  const gridClass =
    layout === 'single' || items.length === 1
      ? 'rounded-xl overflow-hidden border border-border'
      : `rounded-xl overflow-hidden border border-border grid gap-0.5 ${items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`;

  const singleVisual = layout === 'single' || items.length === 1;

  return (
    <div className={cn(gridClass, className)}>
      {items.map((item, idx) => {
        const { url, kind } = item;
        const cellClass =
          singleVisual ? '' : 'aspect-square min-h-0 overflow-hidden';

        if (kind === 'video') {
          return (
            <div key={`${url}-${idx}`} className={cn(cellClass, !singleVisual && 'bg-black')}>
              <video
                src={url}
                className={
                  singleVisual
                    ? cn('w-full h-auto object-cover max-h-80', imgClassSingle)
                    : 'w-full h-full object-cover'
                }
                controls
                playsInline
                preload="metadata"
              />
            </div>
          );
        }

        if (kind === 'audio') {
          return (
            <div
              key={`${url}-${idx}`}
              className={cn(
                'flex items-center bg-muted/50 p-3',
                singleVisual ? '' : 'min-h-[120px]',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <audio src={url} controls className="w-full max-h-14" preload="metadata" />
            </div>
          );
        }

        if (kind === 'document') {
          return (
            <a
              key={`${url}-${idx}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'flex items-center gap-3 bg-muted/50 p-3 text-foreground hover:bg-muted/70 transition-colors',
                singleVisual ? 'rounded-xl' : 'min-h-[120px]',
                !singleVisual && cellClass,
              )}
            >
              <FileText className="h-8 w-8 shrink-0 text-primary" aria-hidden />
              <span className="text-sm font-medium truncate">
                <span className="sr-only">Attachment: </span>
                <LangText path="posts.open_file"  />
              </span>
            </a>
          );
        }

        const imageSizes = singleVisual
          ? '(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 900px'
          : '(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 420px';
        const frameAspect = singleVisual ? FEED_WIDE_ASPECT_RATIO : FEED_GRID_ASPECT_RATIO;

        return (
          <div key={`${url}-${idx}`} className={cellClass}>
            <FramedImage
              src={url}
              variantUrls={item.imageVariantUrls}
              imageDisplay={item.imageDisplay}
              alt={`Post attachment ${idx + 1}`}
              sizes={imageSizes}
              frameAspectRatio={frameAspect}
              className={singleVisual ? cn('w-full', imgClassSingle) : 'h-full w-full'}
              frameClassName={singleVisual ? 'w-full' : 'h-full w-full'}
              imgClassName={singleVisual ? undefined : 'h-full w-full'}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Preview for a local `File` in create/edit post composers (revokes object URL on unmount). */
export function LocalPostMediaFileThumb({ file, onRemove, removeAriaLabel = 'Remove' }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const kind = postMediaKindFromFile(file);
  const imageDisplay = getImageDisplayMetadataFromFile(file);

  return (
    <div className={cn('relative inline-block', (kind === 'audio' || kind === 'document') && 'align-top')}>
      {kind === 'image' ? (
        <FramedImage
          src={url}
          imageDisplay={imageDisplay}
          alt=""
          frameAspectRatio={1}
          className="h-20 w-20 rounded-lg border border-border"
          frameClassName="h-20 w-20 rounded-lg"
        />
      ) : kind === 'video' ? (
        <video
          src={url}
          className="h-20 w-20 rounded-lg object-cover border border-border bg-black"
          muted
          playsInline
          preload="metadata"
        />
      ) : kind === 'audio' ? (
        <div className="h-20 w-32 rounded-lg border border-border bg-muted/80 flex items-center p-1">
          <audio src={url} controls className="w-full h-8" preload="metadata" />
        </div>
      ) : (
        <div className="h-20 min-w-[140px] max-w-[200px] rounded-lg border border-border bg-muted/80 flex items-center gap-2 px-2 py-1.5">
          <FileText className="h-7 w-7 shrink-0 text-primary" aria-hidden />
          <span className="text-[10px] text-muted-foreground line-clamp-2 break-all" title={file.name}>
            {file.name}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
        aria-label={removeAriaLabel}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
