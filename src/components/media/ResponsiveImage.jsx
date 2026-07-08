import { buildSrcSetFromVariantMap } from '@/lib/responsiveImage';
import { cn } from '@/lib/utils';

/**
 * Responsive raster image: uses API `imageVariantUrls` style maps for `srcSet` when present.
 *
 * @param {{
 *   src: string,
 *   variantUrls?: Record<string, string> | null,
 *   alt?: string,
 *   className?: string,
 *   sizes?: string,
 *   loading?: 'lazy' | 'eager',
 *   decoding?: 'async' | 'auto' | 'sync',
 * }} props
 */
export function ResponsiveImage({
  src,
  variantUrls = null,
  alt = '',
  className,
  sizes,
  loading = 'lazy',
  decoding = 'async',
}) {
  const { src: resolvedSrc, srcSet, sizes: resolvedSizes } = buildSrcSetFromVariantMap(src, variantUrls, sizes);
  if (!resolvedSrc) {
    return null;
  }
  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      className={cn(className)}
      loading={loading}
      decoding={decoding}
    />
  );
}
