import { scaleDimensionsToMaxEdge } from '@/lib/imageCropOutput';

const DEFAULT_MAX_EDGE = 2560;
const JPEG_QUALITY = 0.95;
const DEFAULT_FIT_BACKGROUND = '#ffffff';

/** @typedef {'cover' | 'fit'} FrameFitMode */

/**
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} aspectRatio width / height
 */
export function fitFrameSize(maxWidth, maxHeight, aspectRatio) {
  const safeAspect = aspectRatio > 0 ? aspectRatio : 1;
  let width = maxWidth;
  let height = width / safeAspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspect;
  }
  return {
    width: Math.max(1, Math.floor(width)),
    height: Math.max(1, Math.floor(height)),
  };
}

/**
 * @param {number} imageWidth natural width
 * @param {number} imageHeight natural height
 * @param {number} rotation degrees
 */
export function orientedImageSize(imageWidth, imageHeight, rotation) {
  const swap = Math.abs(rotation) % 180 === 90;
  return swap
    ? { width: imageHeight, height: imageWidth }
    : { width: imageWidth, height: imageHeight };
}

/**
 * Uniform scale (natural px → frame px) for cover-fill or fit-entire modes.
 * @param {FrameFitMode} fitMode
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {number} rotation
 */
export function computeFrameBaseScale(
  fitMode,
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
  rotation = 0,
) {
  const oriented = orientedImageSize(imageWidth, imageHeight, rotation);
  const scaleX = frameWidth / oriented.width;
  const scaleY = frameHeight / oriented.height;
  return fitMode === 'fit'
    ? Math.min(scaleX, scaleY)
    : Math.max(scaleX, scaleY);
}

/**
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {number} rotation
 */
export function computeCoverBaseScale(imageWidth, imageHeight, frameWidth, frameHeight, rotation = 0) {
  return computeFrameBaseScale('cover', imageWidth, imageHeight, frameWidth, frameHeight, rotation);
}

/**
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {number} rotation
 */
export function computeFitBaseScale(imageWidth, imageHeight, frameWidth, frameHeight, rotation = 0) {
  return computeFrameBaseScale('fit', imageWidth, imageHeight, frameWidth, frameHeight, rotation);
}

/**
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {number} baseScale
 * @param {number} zoom
 * @param {number} rotation
 */
export function computeDisplayedImageSize(
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
  baseScale,
  zoom,
  rotation,
) {
  const oriented = orientedImageSize(imageWidth, imageHeight, rotation);
  const scale = baseScale * zoom;
  return {
    width: oriented.width * scale,
    height: oriented.height * scale,
  };
}

/**
 * @param {number} imageSpan displayed width or height
 * @param {number} frameSpan frame width or height
 * @param {number} pan
 */
export function clampPanAxis(imageSpan, frameSpan, pan) {
  if (imageSpan <= frameSpan) {
    return 0;
  }
  const max = (imageSpan - frameSpan) / 2;
  return Math.min(max, Math.max(-max, pan));
}

/**
 * @param {{ x: number, y: number }} pan
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @param {number} baseScale
 * @param {number} zoom
 * @param {number} rotation
 */
export function clampPan(
  pan,
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
  baseScale,
  zoom,
  rotation,
) {
  const displayed = computeDisplayedImageSize(
    imageWidth,
    imageHeight,
    frameWidth,
    frameHeight,
    baseScale,
    zoom,
    rotation,
  );
  const swap = Math.abs(rotation) % 180 === 90;
  const panX = swap ? pan.y : pan.x;
  const panY = swap ? pan.x : pan.y;
  const spanX = swap ? displayed.height : displayed.width;
  const spanY = swap ? displayed.width : displayed.height;
  const clampedX = clampPanAxis(spanX, frameWidth, panX);
  const clampedY = clampPanAxis(spanY, frameHeight, panY);
  return swap ? { x: clampedY, y: clampedX } : { x: clampedX, y: clampedY };
}

/**
 * @param {FrameFitMode} fitMode
 * @returns {'fit' | 'crop'}
 */
export function frameFitModeToDisplayMode(fitMode) {
  return fitMode === 'fit' ? 'fit' : 'crop';
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToJpegBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate image (canvas.toBlob returned null)'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', JPEG_QUALITY);
  });
}

/**
 * Renders exactly the visible fixed frame area to a JPEG blob.
 *
 * @param {HTMLImageElement} image
 * @param {{
 *   fitMode?: FrameFitMode,
 *   aspectRatio: number,
 *   frameWidth: number,
 *   frameHeight: number,
 *   baseScale: number,
 *   zoom: number,
 *   rotation: number,
 *   panX: number,
 *   panY: number,
 *   backgroundColor?: string,
 *   maxEdge?: number,
 * }} options
 */
export async function exportFixedFrameBlob(
  image,
  {
    fitMode: _fitMode = 'cover',
    aspectRatio,
    frameWidth,
    frameHeight,
    baseScale,
    zoom,
    rotation,
    panX,
    panY,
    backgroundColor = DEFAULT_FIT_BACKGROUND,
    maxEdge = DEFAULT_MAX_EDGE,
  },
) {
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  if (!iw || !ih || frameWidth <= 0 || frameHeight <= 0) {
    throw new Error('Invalid image or frame dimensions');
  }

  const outputSize = scaleDimensionsToMaxEdge(frameWidth, frameHeight, maxEdge);
  const pixelRatio = outputSize.width / frameWidth;
  const canvas = document.createElement('canvas');
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawScale = baseScale * zoom * pixelRatio;
  const cx = outputSize.width / 2 + panX * pixelRatio;
  const cy = outputSize.height / 2 + panY * pixelRatio;
  const rotateRadians = (rotation * Math.PI) / 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotateRadians);
  ctx.scale(drawScale, drawScale);
  ctx.drawImage(image, -iw / 2, -ih / 2, iw, ih);
  ctx.restore();

  if (Math.abs(aspectRatio - outputSize.width / outputSize.height) > 0.02) {
    // Frame aspect ratio drives output dimensions via scaleDimensionsToMaxEdge.
  }

  return canvasToJpegBlob(canvas);
}
