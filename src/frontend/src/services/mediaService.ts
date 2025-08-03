// Media Service for handling file uploads and conversions
import { authCanisterService } from "./authCanisterService";
import { media } from "../../../declarations/media";

export interface ImageUploadOptions {
  maxSizeKB?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageRetrievalOptions {
  enableCache?: boolean;
  fallbackImageUrl?: string;
}

const DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
  maxSizeKB: 450, // 450KB limit as defined in media canister
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
  ],
  maxWidth: 1024,
  maxHeight: 1024,
};

const DEFAULT_RETRIEVAL_OPTIONS: Required<ImageRetrievalOptions> = {
  enableCache: true,
  fallbackImageUrl: "/default-avatar.png",
};

// Cache for storing converted data URLs
const imageCache = new Map<string, string>();

/**
 * Extracts media ID from a media URL
 */
export const extractMediaIdFromUrl = (url: string): string | null => {
  try {
    // Handle URLs in format: /media/{mediaId} or media://{mediaId}
    if (url.startsWith("media://")) {
      return url.replace("media://", "").split("/").pop() || null;
    }

    if (url.startsWith("/media/")) {
      return url.replace("/media/", "").split("/").pop() || null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting media ID from URL:", error);
    return null;
  }
};

/**
 * Converts a media canister URL to a data URL for direct use in img tags
 */
export const getImageDataUrl = async (
  mediaUrl: string,
  options: ImageRetrievalOptions = {},
): Promise<string> => {
  const opts = { ...DEFAULT_RETRIEVAL_OPTIONS, ...options };

  try {
    // Check cache first if enabled
    if (opts.enableCache && imageCache.has(mediaUrl)) {
      return imageCache.get(mediaUrl)!;
    }

    // Extract media ID from URL
    const mediaId = extractMediaIdFromUrl(mediaUrl);
    if (!mediaId) {
      console.warn("Could not extract media ID from URL:", mediaUrl);
      return opts.fallbackImageUrl;
    }

    // Get file data from media canister
    if (!media) {
      console.error("Media canister not available");
      return opts.fallbackImageUrl;
    }

    const result = await media.getFileData(mediaId);

    if ("err" in result) {
      console.warn("Failed to retrieve image data:", result.err);
      return opts.fallbackImageUrl;
    }

    // Get media item for content type
    const mediaItemResult = await media.getMediaItem(mediaId);
    if ("err" in mediaItemResult) {
      console.warn("Failed to retrieve media item:", mediaItemResult.err);
      return opts.fallbackImageUrl;
    }

    // Convert Uint8Array to data URL
    const uint8Array = new Uint8Array(result.ok);
    const contentType = mediaItemResult.ok.contentType;
    const dataUrl = await convertBlobToDataUrl(uint8Array, contentType);

    // Cache the result if enabled
    if (opts.enableCache) {
      imageCache.set(mediaUrl, dataUrl);
    }

    return dataUrl;
  } catch (error) {
    console.error("Error retrieving image data:", error);
    return opts.fallbackImageUrl;
  }
};

/**
 * Converts Uint8Array to data URL
 */
export const convertBlobToDataUrl = (
  uint8Array: Uint8Array,
  contentType: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([uint8Array], { type: contentType });
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.onerror = () => {
        reject(new Error("Failed to convert blob to data URL"));
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Preloads an image to ensure it's in cache
 */
export const preloadImage = async (mediaUrl: string): Promise<void> => {
  try {
    await getImageDataUrl(mediaUrl, { enableCache: true });
  } catch (error) {
    console.warn("Failed to preload image:", mediaUrl, error);
  }
};

/**
 * Clears the image cache
 */
export const clearImageCache = (): void => {
  imageCache.clear();
};

/**
 * Gets cache size information
 */
export const getCacheInfo = (): { size: number; keys: string[] } => {
  return {
    size: imageCache.size,
    keys: Array.from(imageCache.keys()),
  };
};

/**
 * Validates an image file before upload
 */
export const validateImageFile = (
  file: File,
  options: ImageUploadOptions = {},
): string | null => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  const fileSizeKB = file.size / 1024;
  if (fileSizeKB > opts.maxSizeKB) {
    return `File size (${fileSizeKB.toFixed(1)}KB) exceeds maximum allowed size of ${opts.maxSizeKB}KB`;
  }

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not supported. Allowed types: ${opts.allowedTypes.join(", ")}`;
  }

  return null; // Valid file
};

/**
 * Converts a File object to Uint8Array for canister upload
 */
export const fileToUint8Array = (file: File): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const arrayBuffer = event.target.result as ArrayBuffer;
        resolve(new Uint8Array(arrayBuffer));
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Resizes an image if it exceeds maximum dimensions
 */
export const resizeImage = (
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error("Failed to resize image"));
          }
        },
        file.type,
        quality,
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Complete profile picture upload workflow
 */
export const uploadProfilePicture = async (
  file: File,
  options: ImageUploadOptions = {},
): Promise<any> => {
  try {
    // Validate file
    const validationError = validateImageFile(file, options);
    if (validationError) {
      throw new Error(validationError);
    }

    // Resize if needed
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let processedFile = file;

    if (opts.maxWidth || opts.maxHeight) {
      processedFile = await resizeImage(file, opts.maxWidth, opts.maxHeight);
    }

    // Convert to Uint8Array
    const fileData = await fileToUint8Array(processedFile);

    // Upload via auth canister
    const result = await authCanisterService.uploadProfilePicture(
      processedFile.name,
      processedFile.type,
      fileData,
    );

    return result;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

export const mediaService = {
  // File validation and processing
  validateImageFile,
  fileToUint8Array,
  resizeImage,

  // Upload functionality
  uploadProfilePicture,

  // Image retrieval functionality
  getImageDataUrl,
  extractMediaIdFromUrl,
  convertBlobToDataUrl,
  preloadImage,

  // Cache management
  clearImageCache,
  getCacheInfo,

  /**
   * Remove profile picture
   */
  async removeProfilePicture() {
    try {
      return await authCanisterService.removeProfilePicture();
    } catch (error) {
      console.error("Error removing profile picture:", error);
      throw error;
    }
  },
};

export default mediaService;
