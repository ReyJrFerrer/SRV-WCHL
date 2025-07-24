import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import reputationCanisterService, {
  updateReputationActor,
} from "../services/reputationCanisterService";

export interface ReputationScore {
  userId: string;
  trustScore: number;
  trustLevel: "New" | "Low" | "Medium" | "High" | "VeryHigh";
  completedBookings: number;
  averageRating?: number;
  detectionFlags: string[];
  lastUpdated: number;
}

/**
 * Custom hook to manage user's reputation data with separate fetching for modularization
 * Provides reputation score, loading states, and error handling as requested
 */
export const useReputation = () => {
  const { isAuthenticated, identity } = useAuth();

  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the current user's reputation score
   * If reputation doesn't exist, try to initialize it
   */
  const fetchReputation = useCallback(async () => {
    if (!isAuthenticated || !identity) {
      setLoading(false);
      setError("Authentication required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the actor with current identity
      updateReputationActor(identity);

      try {
        // Try to fetch existing reputation
        const reputationData =
          await reputationCanisterService.getMyReputationScore();

        // Convert the reputation data to match our interface
        const formattedReputation: ReputationScore = {
          userId: reputationData.userId.toString(),
          trustScore: Number(reputationData.trustScore),
          trustLevel: reputationData.trustLevel.hasOwnProperty("New")
            ? "New"
            : reputationData.trustLevel.hasOwnProperty("Low")
              ? "Low"
              : reputationData.trustLevel.hasOwnProperty("Medium")
                ? "Medium"
                : reputationData.trustLevel.hasOwnProperty("High")
                  ? "High"
                  : "VeryHigh",
          completedBookings: Number(reputationData.completedBookings),
          averageRating: reputationData.averageRating
            ? Number(reputationData.averageRating[0])
            : undefined,
          detectionFlags: reputationData.detectionFlags.map(
            (flag: any) => Object.keys(flag)[0],
          ),
          lastUpdated: Number(reputationData.lastUpdated),
        };

        setReputation(formattedReputation);
      } catch (fetchError: any) {
        // If reputation doesn't exist, try to initialize it
        if (fetchError.message.includes("No reputation score found")) {
          console.log("📊 No reputation found, initializing...");

          const initialReputation =
            await reputationCanisterService.initializeMyReputation();

          const formattedReputation: ReputationScore = {
            userId: initialReputation.userId.toString(),
            trustScore: Number(initialReputation.trustScore),
            trustLevel: "New",
            completedBookings: 0,
            averageRating: undefined,
            detectionFlags: [],
            lastUpdated: Number(initialReputation.lastUpdated),
          };

          setReputation(formattedReputation);
        } else {
          throw fetchError;
        }
      }
    } catch (err: any) {
      console.error("❌ Failed to fetch reputation:", err);

      // Display network error as requested
      if (
        err.message.includes("Network error") ||
        err.message.includes("fetch")
      ) {
        setError("Network error: Could not fetch reputation score");
      } else {
        setError(err.message || "Could not load reputation data");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, identity]);

  /**
   * Refresh reputation data
   */
  const refreshReputation = useCallback(async () => {
    await fetchReputation();
  }, [fetchReputation]);

  /**
   * Get simplified reputation score for display
   */
  const getReputationDisplay = useCallback(() => {
    if (!reputation) return null;

    return {
      score: Math.round(reputation.trustScore),
      level: reputation.trustLevel,
      bookings: reputation.completedBookings,
      rating: reputation.averageRating,
    };
  }, [reputation]);

  // Fetch reputation when component mounts or authentication changes
  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  return {
    reputation,
    loading,
    error,
    refreshReputation,
    getReputationDisplay,
    isAuthenticated,
  };
};
