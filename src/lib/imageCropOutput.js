const DEFAULT_MAX_EDGE = 2560;
const JPEG_QUALITY = 0.95;

/**
 * @param {number} width
 * @param {number} height
 * @param {number} [maxEdge]
 */
export function scaleDimensionsToMaxEdge(width, height, maxEdge = DEFAULT_MAX_EDGE) {
  const maxDim = Math.max(width, height);
  if (maxDim <= maxEdge) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }
  const scale = maxEdge / maxDim;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * @param {number} width
 * @param {number} height
 * @param {number} aspectRatio width / height
 * @param {number} [maxEdge]
 */
export function scaleToTargetAspect(width, height, aspectRatio, maxEdge = DEFAULT_MAX_EDGE) {
  const safeAspect = aspectRatio > 0 ? aspectRatio : width / Math.max(height, 1);
  let targetWidth = width;
  let targetHeight = height;
  const currentAspect = width / Math.max(height, 1);
  if (Math.abs(currentAspect - safeAspect) > 0.005) {
    if (currentAspect > safeAspect) {
      targetWidth = height * safeAspect;
    } else {
      targetHeight = width / safeAspect;
    }
  }
  return scaleDimensionsToMaxEdge(targetWidth, targetHeight, maxEdge);
}

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
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
 * Draws a react-image-crop pixel crop into a canvas without relying on package internals.
 *
 * @param {HTMLImageElement} image
 * @param {HTMLCanvasElement} canvas
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop
 * @param {number} [scale]
 * @param {number} [rotate]
 */
function cropToCanvas(image, canvas, pixelCrop, scale = 1, rotate = 0) {
  const targetCanvas = canvas;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropX = pixelCrop.x * scaleX;
  const cropY = pixelCrop.y * scaleY;
  const cropWidth = pixelCrop.width * scaleX;
  const cropHeight = pixelCrop.height * scaleY;

  targetCanvas.width = Math.max(1, Math.round(cropWidth));
  targetCanvas.height = Math.max(1, Math.round(cropHeight));

  const rotateRadians = (rotate * Math.PI) / 180;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRadians);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
  ctx.restore();
}

/**
 * @param {HTMLImageElement} image
 * @param {{ x: number, y: number, width: number, height: number, unit?: string }} pixelCrop
 * @param {boolean} [isCircular]
 * @param {number} [scale]
 * @param {number} [rotate]
 * @param {number} [targetAspectRatio]
 * @returns {Promise<Blob>}
 */
export async function exportCroppedImageBlob(
  image,
  pixelCrop,
  isCircular = false,
  scale = 1,
  rotate = 0,
  targetAspectRatio,
) {
  if (!pixelCrop || pixelCrop.width <= 0 || pixelCrop.height <= 0) {
    throw new Error('Invalid crop area');
  }

  const croppedCanvas = document.createElement('canvas');
  cropToCanvas(image, croppedCanvas, pixelCrop, scale, rotate);

  const outputSize = typeof targetAspectRatio === 'number' && targetAspectRatio > 0
    ? scaleToTargetAspect(croppedCanvas.width, croppedCanvas.height, targetAspectRatio)
    : scaleDimensionsToMaxEdge(croppedCanvas.width, croppedCanvas.height);
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputSize.width;
  outputCanvas.height = outputSize.height;
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) {
    throw new Error('Could not create canvas context');
  }

  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = 'high';

  if (isCircular) {
    outputCtx.beginPath();
    outputCtx.arc(
      outputSize.width / 2,
      outputSize.height / 2,
      Math.min(outputSize.width, outputSize.height) / 2,
      0,
      2 * Math.PI,
    );
    outputCtx.closePath();
    outputCtx.clip();
  }

  outputCtx.drawImage(
    croppedCanvas,
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height,
    0,
    0,
    outputSize.width,
    outputSize.height,
  );

  return canvasToJpegBlob(outputCanvas);
}

/**
 * @param {string} imageSrc
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop
 * @param {boolean} [isCircular]
 * @param {number} [scale]
 * @param {number} [rotate]
 * @returns {Promise<Blob>}
 */
export async function getCroppedImageBlob(
  imageSrc,
  pixelCrop,
  isCircular = false,
  scale = 1,
  rotate = 0,
  targetAspectRatio,
) {
  const image = await loadImageElement(imageSrc);
  return exportCroppedImageBlob(image, pixelCrop, isCircular, scale, rotate, targetAspectRatio);
}
