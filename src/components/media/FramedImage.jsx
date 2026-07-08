import { buildSrcSetFromVariantMap } from '@/lib/responsiveImage';
import { normalizeCoverDisplayMetadata, resolveDisplayAspectRatio } from '@/lib/imageCropMetadata';
import { cn } from '@/lib/utils';

/**
 * Responsive raster image framed with object-cover (no blur, letterbox, or fit padding).
 * Cropped uploads are pre-sized to the target aspect; the frame matches card/banner ratios.
 *
 * @param {{
 *   src: string,
 *   variantUrls?: Record<string, string> | null,
 *   imageDisplay?: import('@/lib/imageCropMetadata').ImageDisplayMetadata | null,
 *   alt?: string,
 *   className?: string,
 *   imgClassName?: string,
 *   frameClassName?: string,
 *   sizes?: string,
 *   loading?: 'lazy' | 'eager',
 *   decoding?: 'async' | 'auto' | 'sync',
 *   isCircular?: boolean,
 *   frameAspectRatio?: number,
 * }} props
 */
export function FramedImage({
  src,
  variantUrls = null,
  imageDisplay = null,
  alt = '',
  className,
  imgClassName,
  frameClassName,
  sizes,
  loading = 'lazy',
  decoding = 'async',
  isCircular = false,
  frameAspectRatio,
}) {
  const display = normalizeCoverDisplayMetadata(imageDisplay);
  const { src: resolvedSrc, srcSet, sizes: resolvedSizes } = buildSrcSetFromVariantMap(src, variantUrls, sizes);

  if (!resolvedSrc) {
    return null;
  }

  const aspectRatio = resolveDisplayAspectRatio(display, frameAspectRatio);
  const frameStyle =
    !isCircular && aspectRatio && aspectRatio > 0 ? { aspectRatio: String(aspectRatio) } : undefined;

  const img = (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cn(
        'h-full w-full object-cover object-center',
        isCircular && 'rounded-full',
        imgClassName,
      )}
    />
  );

  if (isCircular) {
    return (
      <div
        className={cn('overflow-hidden rounded-full', frameClassName, className)}
        style={frameStyle}
      >
        {img}
      </div>
    );
  }

  if (frameStyle) {
    return (
      <div className={cn('overflow-hidden', frameClassName, className)} style={frameStyle}>
        {img}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cn('object-cover object-center', className, imgClassName)}
    />
  );
}
