// Media Service for handling file uploads and conversions
import { authCanisterService } from "./authCanisterService";

export interface ImageUploadOptions {
  maxSizeKB?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
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
  validateImageFile,
  fileToUint8Array,
  resizeImage,
  uploadProfilePicture,

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
