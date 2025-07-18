// Asset resolver utility for handling backend image references
// This bridges the gap between backend image paths and frontend asset requirements

/**
 * Resolves backend image paths to frontend require() statements
 * @param imagePath - Path from backend (e.g., "/images/Maid1.jpg")
 * @returns Resolved asset path for frontend use
 */
export function resolveAssetPath(imagePath: string): any {
  if (!imagePath) return null;

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith("/")
    ? imagePath.substring(1)
    : imagePath;

  // Map common image paths to their require() equivalents
  const assetMap: { [key: string]: any } = {
    "images/Maid1.jpg": require("../../assets/images/Maid1.jpg"),
    "images/Maid2.jpg": require("../../assets/images/maid2.jpg"),
    "images/Plumber1.jpg": require("../../assets/images/Plumber1.jpg"),
    "images/Plumber2.jpg": require("../../assets/images/Plumber2.jpg"),
    "images/Technician1.jpg": require("../../assets/images/Technician1.jpg"),
    "images/Technician2.jpg": require("../../assets/images/Technician2.jpg"),
    "images/BeautyServices-Hairstylist1.jpg": require("../../assets/images/BeautyServices-Hairstylist1.jpg"),
    "images/BeautyServices-Hairstylist2.jpg": require("../../assets/images/BeautyServices-Hairstylist2.jpg"),
    "images/BeautyServices-Hairstylist3.jpg": require("../../assets/images/BeautyServices-Hairstylist3.jpg"),
    "images/Photographer-ProPhotographer1.jpg": require("../../assets/images/Photographer-ProPhotographer.jpg"),
    "images/Photographer-ProPhotographer2.jpg": require("../../assets/images/Photographer-ProPhotographer2.jpg"),
    "images/Photographer-ProPhotographer3.jpg": require("../../assets/images/Photographer-ProPhotographer3.jpg"),
    "images/DeliveryService-Courier1.jpg": require("../../assets/images/Delivery-Courier1.jpg"),
    "images/DeliveryService-Courier2.jpg": require("../../assets/images/Delivery-Courier2.jpg"),
    // Add more mappings as needed
  };

  return assetMap[cleanPath] || imagePath;
}

/**
 * Converts backend profile data to frontend-compatible format
 * @param backendProfile - Profile data from ICP backend
 * @returns Frontend-compatible profile with resolved asset paths
 */
export function adaptBackendProfile(backendProfile: any): any {
  if (!backendProfile) return null;

  // Convert timestamps from nanoseconds to milliseconds
  const convertTime = (nanoseconds: bigint | number): Date => {
    const milliseconds =
      typeof nanoseconds === "bigint"
        ? Number(nanoseconds / BigInt(1_000_000))
        : Number(nanoseconds) / 1_000_000;
    return new Date(milliseconds);
  };

  // Extract role type from backend variant
  const extractRole = (roleVariant: any): "Client" | "ServiceProvider" => {
    if (roleVariant && typeof roleVariant === "object") {
      if ("Client" in roleVariant) return "Client";
      if ("ServiceProvider" in roleVariant) return "ServiceProvider";
    }
    return "Client"; // default fallback
  };

  const adapted: any = {
    id: backendProfile.id.toString(),
    name: backendProfile.name,
    email: backendProfile.email,
    phone: backendProfile.phone,
    role: extractRole(backendProfile.role),
    isVerified: backendProfile.isVerified,
    biography: backendProfile.biography?.[0] || undefined, // Optional fields come as arrays
    createdAt: convertTime(backendProfile.createdAt),
    updatedAt: convertTime(backendProfile.updatedAt),
  };

  // Resolve profile picture paths
  if (backendProfile.profilePicture && backendProfile.profilePicture[0]) {
    const profilePic = backendProfile.profilePicture[0];
    adapted.profilePicture = {
      imageUrl: resolveAssetPath(profilePic.imageUrl),
      thumbnailUrl: resolveAssetPath(profilePic.thumbnailUrl),
    };
  }

  return adapted;
}

/**
 * Helper function to get asset path for a specific image name
 * Useful for dynamic asset loading
 */
export function getAssetByName(imageName: string): any {
  return resolveAssetPath(`images/${imageName}`);
}
