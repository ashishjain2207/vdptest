/**
 * Image validation utilities for profile and cover images
 */

import { DEFAULT_MAX_INPUT_IMAGE_BYTES } from '@/lib/mediaOptimize.js';

const formatPixels = (width, height) => `${width}x${height} px`;

// Constants for image requirements
export const IMAGE_CONSTRAINTS = {
  // Cover image requirements (based on LinkedIn, Twitter, Facebook standards)
  COVER: {
    MIN_WIDTH: 1200,
    MIN_HEIGHT: 300,
    RECOMMENDED_ASPECT_RATIO_MIN: 3, // 3:1 (width:height)
    RECOMMENDED_ASPECT_RATIO_MAX: 5, // 5:1 (width:height)
    /** Aspect ratio for the cover image cropper (width/height). Must be within RECOMMENDED_ASPECT_RATIO_MIN–MAX. */
    COVER_CROP_ASPECT_RATIO: 4, // 4:1 – matches validation guidance (3:1 to 5:1)
  },
  // Avatar image requirements
  AVATAR: {
    MIN_WIDTH: 200,
    MIN_HEIGHT: 200,
    RECOMMENDED_SIZE: 400, // Square 400x400 recommended
  },
  // General constraints
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

export const AVATAR_RECOMMENDED_TEXT = `Recommended: square image, at least ${formatPixels(
  IMAGE_CONSTRAINTS.AVATAR.RECOMMENDED_SIZE,
  IMAGE_CONSTRAINTS.AVATAR.RECOMMENDED_SIZE,
)}.`;

/**
 * Load an image file and return its dimensions
 * @param {File} file - The image file to load
 * @returns {Promise<{width: number, height: number, aspectRatio: number}>}
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Validate cover image dimensions and aspect ratio
 * @param {File} file - The image file to validate
 * @returns {Promise<{valid: boolean, error?: string, dimensions?: object, warning?: string}>}
 */
export const validateCoverImage = async (file) => {
  try {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'Please select an image file',
      };
    }

    // Check file size
    if (file.size > DEFAULT_MAX_INPUT_IMAGE_BYTES) {
      return {
        valid: false,
        error: `Image must be smaller than ${DEFAULT_MAX_INPUT_IMAGE_BYTES / (1024 * 1024)} MB (it will be compressed automatically before upload).`,
      };
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    const { width, height, aspectRatio } = dimensions;
    const { MIN_WIDTH, MIN_HEIGHT, RECOMMENDED_ASPECT_RATIO_MIN, RECOMMENDED_ASPECT_RATIO_MAX } = IMAGE_CONSTRAINTS.COVER;

    // Check minimum dimensions
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return {
        valid: false,
        error: `Cover image is too small. Minimum size is ${formatPixels(MIN_WIDTH, MIN_HEIGHT)}. Your image is ${formatPixels(width, height)}.`,
        dimensions,
      };
    }

    // Check if aspect ratio is within recommended range (informational warning, not blocking)
    let warning = null;
    if (aspectRatio < RECOMMENDED_ASPECT_RATIO_MIN || aspectRatio > RECOMMENDED_ASPECT_RATIO_MAX) {
      warning = `For best results, use images with ${RECOMMENDED_ASPECT_RATIO_MIN}:1 to ${RECOMMENDED_ASPECT_RATIO_MAX}:1 aspect ratio. Your image is ${aspectRatio.toFixed(1)}:1`;
    }

    return {
      valid: true,
      dimensions,
      warning,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Failed to validate image',
    };
  }
};

/**
 * Validate avatar image dimensions
 * @param {File} file - The image file to validate
 * @returns {Promise<{valid: boolean, error?: string, dimensions?: object, warning?: string}>}
 */
export const validateAvatarImage = async (file) => {
  try {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'Please select an image file',
      };
    }

    // Check file size
    if (file.size > DEFAULT_MAX_INPUT_IMAGE_BYTES) {
      return {
        valid: false,
        error: `Image must be smaller than ${DEFAULT_MAX_INPUT_IMAGE_BYTES / (1024 * 1024)} MB (it will be compressed automatically before upload).`,
      };
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    const { width, height } = dimensions;
    const { MIN_WIDTH, MIN_HEIGHT, RECOMMENDED_SIZE } = IMAGE_CONSTRAINTS.AVATAR;

    // Check minimum dimensions
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      const issues = [];
      if (width < MIN_WIDTH) {
        issues.push(`width must be at least ${MIN_WIDTH}px`);
      }
      if (height < MIN_HEIGHT) {
        issues.push(`height must be at least ${MIN_HEIGHT}px`);
      }
      return {
        valid: false,
        error: `Profile picture must be at least ${formatPixels(MIN_WIDTH, MIN_HEIGHT)}. Your image is ${formatPixels(width, height)}${issues.length ? `, so ${issues.join(' and ')}` : ''}. ${AVATAR_RECOMMENDED_TEXT}`,
        dimensions,
      };
    }

    // Recommend square images for avatars
    let warning = null;
    const minDimension = Math.min(width, height);
    if (minDimension < RECOMMENDED_SIZE) {
      warning = AVATAR_RECOMMENDED_TEXT;
    }

    return {
      valid: true,
      dimensions,
      warning,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Failed to validate image',
    };
  }
};
