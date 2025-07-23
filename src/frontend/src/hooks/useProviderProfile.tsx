import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import authCanisterService, {
  FrontendProfile,
} from "../services/authCanisterService"; // Adjust path as needed

/**
 * Custom hook to manage the client's profile data, including fetching and updating.
 */
export const useProviderProfile = () => {
  const { isAuthenticated, identity } = useAuth();

  const [profile, setProfile] = useState<FrontendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (isAuthenticated && identity) {
      setLoading(true);
      setError(null);
      try {
        const userProfile = await authCanisterService.getMyProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, identity]);

  const uploadImageToServer = (imageFile: File): Promise<string> => {
    return new Promise((resolve) => {
      // Simulate a delay for the upload process
      setTimeout(() => {
        // In a real app, you'd get a URL from your storage service.
        // For now, we'll use a placeholder or the local blob URL for demonstration.
        resolve(URL.createObjectURL(imageFile));
      }, 1500);
    });
  };

  // This effect triggers the profile fetch when the component mounts
  // or when the user's authentication status changes.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Updates the user's profile with new information.
   * @param updatedData - An object containing the new name and phone number.
   * @returns A boolean indicating whether the update was successful.
   */
  const updateProfile = async (updatedData: {
    name: string;
    phone: string;
    imageFile?: File | null;
  }) => {
    if (!isAuthenticated) {
      setError("You must be logged in to update your profile.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Handle avatar image only in frontend state
      let avatarUrl = profile?.profilePicture?.imageUrl || "";
      if (updatedData.imageFile) {
        avatarUrl = await uploadImageToServer(updatedData.imageFile);
        // Update the profile state with the new avatar URL
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                profilePicture: {
                  imageUrl: avatarUrl,
                  thumbnailUrl: avatarUrl,
                },
              }
            : prev,
        );
      }

      // Only update name and phone in backend
      const result = await authCanisterService.updateProfile(
        updatedData.name,
        updatedData.phone,
      );

      if (result) {
        await fetchProfile(); // Refetch profile to get the latest data
        return true;
      } else {
        throw new Error("An unknown error occurred during the update.");
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("Error updating profile:", errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile: fetchProfile,
  };
};
