import { isProbablyVideoUrl } from '@/lib/mediaUrl';
import { cn } from '@/lib/utils';
import { FramedImage } from '@/components/media/FramedImage';

/**
 * Renders image or video cover from a public media URL.
 * @param {{ src: string; alt: string; className?: string; imgClassName?: string; variantUrls?: Record<string, string> | null; imageDisplay?: import('@/lib/imageCropMetadata').ImageDisplayMetadata | null; responsiveSizes?: string; forceVideo?: boolean; videoMuted?: boolean; videoLoop?: boolean; videoControls?: boolean; frameAspectRatio?: number }} props
 */
export function EventCoverMedia({
  src,
  alt,
  className,
  imgClassName,
  variantUrls = null,
  imageDisplay = null,
  responsiveSizes,
  forceVideo = false,
  videoMuted = true,
  videoLoop = true,
  videoControls = false,
  frameAspectRatio,
}) {
  if (!src) {
    return null;
  }
  const video = forceVideo || isProbablyVideoUrl(src);
  if (video) {
    return (
      <video
        src={src}
        className={cn(className, imgClassName)}
        muted={videoMuted}
        playsInline
        loop={videoLoop}
        controls={videoControls}
        aria-label={alt}
      />
    );
  }
  return (
    <FramedImage
      src={src}
      variantUrls={variantUrls}
      imageDisplay={imageDisplay}
      alt={alt}
      className={cn(className, imgClassName)}
      frameClassName={cn(className, imgClassName)}
      sizes={responsiveSizes ?? '(max-width: 1024px) 100vw, 896px'}
      frameAspectRatio={frameAspectRatio}
    />
  );
}
