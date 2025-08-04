import { useQuery } from "@tanstack/react-query";
import { mediaService } from "../services/mediaService";

export interface UseImageLoaderOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number; // Renamed from cacheTime in newer React Query versions
  retry?: number;
  placeholder?: string;
}

const DEFAULT_OPTIONS: Required<UseImageLoaderOptions> = {
  enabled: true,
  staleTime: 1000 * 60 * 60, // 1 hour
  gcTime: 1000 * 60 * 60 * 24, // 24 hours
  retry: 3,
  placeholder: "",
};

/**
 * Custom hook for loading images with React Query caching
 * Provides optimal performance with browser and memory caching
 */
export const useImageLoader = (
  mediaUrl: string | null | undefined,
  options: UseImageLoaderOptions = {},
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const {
    data: imageDataUrl,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["image", mediaUrl],
    queryFn: async () => {
      if (!mediaUrl) {
        throw new Error("Media URL is required");
      }
      return await mediaService.getImageDataUrl(mediaUrl, {
        enableCache: true,
      });
    },
    enabled: opts.enabled && !!mediaUrl,
    staleTime: opts.staleTime,
    gcTime: opts.gcTime,
    retry: opts.retry,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    /** The data URL for the image (ready to use in src attribute) */
    imageDataUrl: imageDataUrl || opts.placeholder,
    /** Whether the image is currently loading */
    isLoading,
    /** Any error that occurred during loading */
    error: error as Error | null,
    /** Whether an error occurred */
    isError,
    /** Function to manually refetch the image */
    refetch,
    /** Whether the image has been loaded successfully */
    isSuccess: !!imageDataUrl,
  };
};

/**
 * Hook for preloading multiple images
 * Useful for image galleries or carousels
 */
export const useImagePreloader = (mediaUrls: (string | null | undefined)[]) => {
  const validUrls = mediaUrls.filter((url): url is string => !!url);

  const queries = useQuery({
    queryKey: ["preload-images", validUrls],
    queryFn: async () => {
      const preloadPromises = validUrls.map((url) =>
        mediaService.preloadImage(url).catch((error) => ({
          url,
          error: error.message,
        })),
      );

      const results = await Promise.allSettled(preloadPromises);
      return results;
    },
    enabled: validUrls.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    /** Whether preloading is in progress */
    isPreloading: queries.isLoading,
    /** Whether preloading completed */
    isPreloaded: queries.isSuccess,
    /** Any errors that occurred during preloading */
    preloadErrors:
      queries.data?.filter((result: any) => result.status === "rejected") || [],
  };
};

/**
 * Hook for managing profile picture loading specifically
 * Includes fallback to default avatar
 */
export const useProfileImage = (
  profilePictureUrl: string | null | undefined,
  options: UseImageLoaderOptions = {},
) => {
  const defaultAvatar = "/default.svg"; // Assuming you have a default avatar

  const { imageDataUrl, isLoading, error, isError, refetch, isSuccess } =
    useImageLoader(profilePictureUrl, {
      placeholder: defaultAvatar,
      ...options,
    });

  return {
    /** The profile image URL (with fallback to default avatar) */
    profileImageUrl: isSuccess && imageDataUrl ? imageDataUrl : defaultAvatar,
    /** Whether the profile image is loading */
    isLoading: isLoading && !!profilePictureUrl,
    /** Whether to show the default avatar */
    isUsingDefaultAvatar: !profilePictureUrl || (!isSuccess && !isLoading),
    /** Any error that occurred */
    error,
    /** Whether an error occurred */
    isError,
    /** Function to manually refetch the image */
    refetch,
  };
};

/***
 * Hook for fetching service provider profile pictures
 *
 * Inclues fallback to default provider avatar
 */
export const useUserImage = (
  profilePictureUrl: string | null | undefined,

  options: UseImageLoaderOptions = {},
) => {
  const { imageDataUrl, isLoading, error, isError, refetch, isSuccess } =
    useImageLoader(profilePictureUrl, {
      ...options,
    });

  return {
    /** The profile image URL (with fallback to default avatar) */
    userImageUrl: isSuccess && imageDataUrl ? imageDataUrl : undefined,
    /** Whether the profile image is loading */
    isLoading: isLoading && !!profilePictureUrl,
    /** Whether to show the default avatar */
    isUsingDefaultAvatar: !profilePictureUrl || (!isSuccess && !isLoading),
    /** Any error that occurred */
    error,
    /** Whether an error occurred */
    isError,
    /** Function to manually refetch the image */
    refetch,
  };
};

export default useImageLoader;
