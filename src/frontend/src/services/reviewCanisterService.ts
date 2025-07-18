// Review Canister Service
import { Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { 
  idlFactory, 
  canisterId
} from '../../../declarations/review';
import { getHttpAgent, getAdminHttpAgent } from '../utils/icpClient';
import type { 
  _SERVICE as ReviewService,
  Review as CanisterReview,
  ReviewStatus,
  Result,
  Result_1,
  Result_2,
  Result_3,
  Time
} from '../../../declarations/review/review.did';

// Canister configuration
const REVIEW_CANISTER_ID = canisterId || process.env.NEXT_PUBLIC_REVIEW_CANISTER_ID || 'rkp4c-7iaaa-aaaaa-aaaca-cai';

// Create actor
let reviewActor: ReviewService | null = null;

const getReviewActor = async (): Promise<ReviewService> => {
  if (!reviewActor) {
    const agent = await getHttpAgent();
    reviewActor = Actor.createActor(idlFactory, {
      agent: agent,
      canisterId: REVIEW_CANISTER_ID,
    }) as ReviewService;
  }
  return reviewActor;
};

// Frontend-compatible Review interface
export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment: string;
  createdAt: number; // milliseconds
  updatedAt: number; // milliseconds
  status: 'Visible' | 'Hidden' | 'Flagged';
  qualityScore?: number;
}

// Statistics interface
export interface ReviewStatistics {
  totalReviews: number;
  activeReviews: number;
  hiddenReviews: number;
  flaggedReviews: number;
  deletedReviews: number;
}

// Type conversion functions
const convertCanisterReviewToFrontend = (canisterReview: CanisterReview): Review => {
  return {
    id: canisterReview.id,
    bookingId: canisterReview.bookingId,
    clientId: canisterReview.clientId.toText(),
    providerId: canisterReview.providerId.toText(),
    serviceId: canisterReview.serviceId,
    rating: Number(canisterReview.rating),
    comment: canisterReview.comment,
    createdAt: Number(canisterReview.createdAt) / 1_000_000, // Convert nanoseconds to milliseconds
    updatedAt: Number(canisterReview.updatedAt) / 1_000_000,
    status: Object.keys(canisterReview.status)[0] as 'Visible' | 'Hidden' | 'Flagged',
    qualityScore: canisterReview.qualityScore.length > 0 ? Number(canisterReview.qualityScore[0]) : undefined,
  };
};

const convertFrontendReviewToCanister = (review: Partial<Review>): Partial<CanisterReview> => {
  const canisterReview: any = {};
  
  if (review.id) canisterReview.id = review.id;
  if (review.bookingId) canisterReview.bookingId = review.bookingId;
  if (review.clientId) canisterReview.clientId = Principal.fromText(review.clientId);
  if (review.providerId) canisterReview.providerId = Principal.fromText(review.providerId);
  if (review.serviceId) canisterReview.serviceId = review.serviceId;
  if (review.rating !== undefined) canisterReview.rating = BigInt(review.rating);
  if (review.comment) canisterReview.comment = review.comment;
  if (review.createdAt) canisterReview.createdAt = BigInt(review.createdAt * 1_000_000); // Convert milliseconds to nanoseconds
  if (review.updatedAt) canisterReview.updatedAt = BigInt(review.updatedAt * 1_000_000);
  if (review.status) {
    canisterReview.status = { [review.status]: null };
  }
  if (review.qualityScore !== undefined) {
    canisterReview.qualityScore = review.qualityScore !== undefined ? [review.qualityScore] : [];
  }
  
  return canisterReview;
};

// Create actor instance
const createActor = async (): Promise<ReviewService> => {
  const agent = await getHttpAgent();
  
  return Actor.createActor(idlFactory, {
    agent: agent,
    canisterId: REVIEW_CANISTER_ID,
  }) as ReviewService;
};

class ReviewCanisterService {
  private actor: ReviewService | null = null;

  private async getActor(): Promise<ReviewService> {
    if (!this.actor) {
      this.actor = await getReviewActor();
    }
    return this.actor;
  }

  // Submit a review for a booking
  async submitReview(
    bookingId: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    try {
      const actor = await this.getActor();
      const result = await actor.submitReview(bookingId, BigInt(rating), comment);
      
      if ('ok' in result) {
        return convertCanisterReviewToFrontend(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // Get review by ID
  async getReview(reviewId: string): Promise<Review> {
    try {
      const actor = await this.getActor();
      const result = await actor.getReview(reviewId);
      
      if ('ok' in result) {
        return convertCanisterReviewToFrontend(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting review:', error);
      throw error;
    }
  }

  // Get reviews for a booking
  async getBookingReviews(bookingId: string): Promise<Review[]> {
    try {
      const actor = await this.getActor();
      const canisterReviews = await actor.getBookingReviews(bookingId);
      
      return canisterReviews.map(convertCanisterReviewToFrontend);
    } catch (error) {
      console.error('Error getting booking reviews:', error);
      throw error;
    }
  }

  // Get reviews by a user
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const actor = await this.getActor();
      const userPrincipal = Principal.fromText(userId);
      const canisterReviews = await actor.getUserReviews(userPrincipal);
      
      return canisterReviews.map(convertCanisterReviewToFrontend);
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(
    reviewId: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    try {
      const actor = await this.getActor();
      const result = await actor.updateReview(reviewId, BigInt(rating), comment);
      
      if ('ok' in result) {
        return convertCanisterReviewToFrontend(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review (actually hides it)
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const actor = await this.getActor();
      const result = await actor.deleteReview(reviewId);
      
      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  // Calculate average rating for a provider
  async calculateProviderRating(providerId: string): Promise<number> {
    try {
      const actor = await this.getActor();
      const providerPrincipal = Principal.fromText(providerId);
      const result = await actor.calculateProviderRating(providerPrincipal);
      
      if ('ok' in result) {
        return Number(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error calculating provider rating:', error);
      throw error;
    }
  }

  // Calculate average rating for a service
  async calculateServiceRating(serviceId: string): Promise<number> {
    try {
      const actor = await this.getActor();
      const result = await actor.calculateServiceRating(serviceId);
      
      if ('ok' in result) {
        return Number(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error calculating service rating:', error);
      throw error;
    }
  }

  // Calculate user average rating
  async calculateUserAverageRating(userId: string): Promise<number> {
    try {
      const actor = await this.getActor();
      const userPrincipal = Principal.fromText(userId);
      const result = await actor.calculateUserAverageRating(userPrincipal);
      
      if ('ok' in result) {
        return Number(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error calculating user average rating:', error);
      throw error;
    }
  }

  // Get all reviews (for admin or analytics purposes)
  async getAllReviews(): Promise<Review[]> {
    try {
      const actor = await this.getActor();
      const canisterReviews = await actor.getAllReviews();
      
      return canisterReviews.map(convertCanisterReviewToFrontend);
    } catch (error) {
      console.error('Error getting all reviews:', error);
      throw error;
    }
  }

  // Get review statistics
  async getReviewStatistics(): Promise<ReviewStatistics> {
    try {
      const actor = await this.getActor();
      const stats = await actor.getReviewStatistics();
      
      return {
        totalReviews: Number(stats.totalReviews),
        activeReviews: Number(stats.activeReviews),
        hiddenReviews: Number(stats.hiddenReviews),
        flaggedReviews: Number(stats.flaggedReviews),
        deletedReviews: Number(stats.deletedReviews),
      };
    } catch (error) {
      console.error('Error getting review statistics:', error);
      throw error;
    }
  }

  // Set canister references (admin function)
  async setCanisterReferences(
    booking: string,
    service: string,
    reputation: string,
    auth: string
  ): Promise<string | null> {
    try {
      // Use admin agent for setup operations
      const agent = await getAdminHttpAgent();
      
      // Create a fresh actor instance with proper error handling
      const actor = Actor.createActor(idlFactory, {
        agent: agent,
        canisterId: REVIEW_CANISTER_ID,
      }) as ReviewService;
      
      if (!actor) {
        throw new Error('Failed to create actor instance');
      }
      
      const result = await actor.setCanisterReferences(
        Principal.fromText(booking),
        Principal.fromText(service),
        Principal.fromText(reputation),
        Principal.fromText(auth)
      );
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Error setting canister references:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error setting canister references:', error);
      // Reset the actor to force recreation on next call
      reviewActor = null;
      throw new Error(`Failed to set canister references: ${error}`);
    }
  }

  // Initialize static reviews manually (admin function)
  async initializeStaticReviewsManually(): Promise<string> {
    try {
      const actor = await this.getActor();
      const result = await actor.initializeStaticReviewsManually();
      
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error initializing static reviews:', error);
      throw error;
    }
  }

  // Helper method to get reviews for a specific provider
  async getProviderReviews(providerId: string): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      return allReviews.filter(review => 
        review.providerId === providerId && review.status === 'Visible'
      );
    } catch (error) {
      console.error('Error getting provider reviews:', error);
      throw error;
    }
  }

  // Helper method to get reviews for a specific service
  async getServiceReviews(serviceId: string): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      return allReviews.filter(review => 
        review.serviceId === serviceId && review.status === 'Visible'
      );
    } catch (error) {
      console.error('Error getting service reviews:', error);
      throw error;
    }
  }

  // Helper method to check if user can review a booking
  async canUserReviewBooking(bookingId: string, userId: string): Promise<boolean> {
    try {
      // Get existing reviews for this booking by this user
      const bookingReviews = await this.getBookingReviews(bookingId);
      const userReview = bookingReviews.find(review => review.clientId === userId);
      
      // User can review if they haven't already reviewed this booking
      return !userReview;
    } catch (error) {
      console.error('Error checking if user can review booking:', error);
      return false;
    }
  }

  // Helper method to get recent reviews
  async getRecentReviews(limit: number = 10): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      const visibleReviews = allReviews.filter(review => review.status === 'Visible');
      
      // Sort by creation date (most recent first)
      visibleReviews.sort((a, b) => b.createdAt - a.createdAt);
      
      return visibleReviews.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent reviews:', error);
      throw error;
    }
  }

  // Helper method to get top rated reviews
  async getTopRatedReviews(limit: number = 10): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      const visibleReviews = allReviews.filter(review => review.status === 'Visible');
      
      // Sort by rating (highest first) and then by quality score
      visibleReviews.sort((a, b) => {
        if (a.rating !== b.rating) {
          return b.rating - a.rating;
        }
        // If ratings are equal, sort by quality score
        const scoreA = a.qualityScore || 0;
        const scoreB = b.qualityScore || 0;
        return scoreB - scoreA;
      });
      
      return visibleReviews.slice(0, limit);
    } catch (error) {
      console.error('Error getting top rated reviews:', error);
      throw error;
    }
  }
}

// Export the class for advanced usage
export { ReviewCanisterService };

// Create a singleton instance for the default export
const serviceInstance = new ReviewCanisterService();

// Review Canister Service Functions (consistent with other services)
export const reviewCanisterService = {
  /**
   * Submit a review for a booking
   */
  async submitReview(
    bookingId: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    try {
      const actor = await getReviewActor();
      const result = await actor.submitReview(bookingId, BigInt(rating), comment);
      
      if ('ok' in result) {
        return convertCanisterReviewToFrontend(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  /**
   * Get review by ID
   */
  async getReview(reviewId: string): Promise<Review> {
    try {
      const actor = await getReviewActor();
      const result = await actor.getReview(reviewId);
      
      if ('ok' in result) {
        return convertCanisterReviewToFrontend(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error getting review:', error);
      throw error;
    }
  },

  /**
   * Get reviews for a booking
   */
  async getBookingReviews(bookingId: string): Promise<Review[]> {
    try {
      const actor = await getReviewActor();
      const canisterReviews = await actor.getBookingReviews(bookingId);
      
      return canisterReviews.map(convertCanisterReviewToFrontend);
    } catch (error) {
      console.error('Error getting booking reviews:', error);
      throw error;
    }
  },

  /**
   * Get reviews by a user
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const actor = await getReviewActor();
      const userPrincipal = Principal.fromText(userId);
      const canisterReviews = await actor.getUserReviews(userPrincipal);
      
      return canisterReviews.map(convertCanisterReviewToFrontend);
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw error;
    }
  },

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    rating: number,
    comment: string
  ): Promise<Review> {
    try {
      const actor = await getReviewActor();
      const result = await actor.updateReview(reviewId, BigInt(rating), comment);
      
      if ('ok' in result) {
        return convertCanisterReviewToFrontend(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  /**
   * Delete a review (actually hides it)
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const actor = await getReviewActor();
      const result = await actor.deleteReview(reviewId);
      
      if ('err' in result) {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  /**
   * Calculate average rating for a provider
   */
  async calculateProviderRating(providerId: string): Promise<number> {
    try {
      const actor = await getReviewActor();
      const providerPrincipal = Principal.fromText(providerId);
      const result = await actor.calculateProviderRating(providerPrincipal);
      
      if ('ok' in result) {
        return Number(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error calculating provider rating:', error);
      throw error;
    }
  },

  /**
   * Calculate average rating for a service
   */
  async calculateServiceRating(serviceId: string): Promise<number> {
    try {
      const actor = await getReviewActor();
      const result = await actor.calculateServiceRating(serviceId);
      
      if ('ok' in result) {
        return Number(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error calculating service rating:', error);
      throw error;
    }
  },

  /**
   * Calculate user average rating
   */
  async calculateUserAverageRating(userId: string): Promise<number> {
    try {
      const actor = await getReviewActor();
      const userPrincipal = Principal.fromText(userId);
      const result = await actor.calculateUserAverageRating(userPrincipal);
      
      if ('ok' in result) {
        return Number(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error calculating user average rating:', error);
      throw error;
    }
  },

  /**
   * Initialize static reviews manually (admin function)
   */
  async initializeStaticReviewsManually(): Promise<string> {
    try {
      const actor = await getReviewActor();
      const result = await actor.initializeStaticReviewsManually();
      
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error initializing static reviews:', error);
      throw error;
    }
  },


  /**
   * Get all reviews
   */
  async getAllReviews(): Promise<Review[]> {
    try {
      const actor = await getReviewActor();
      const canisterReviews = await actor.getAllReviews();
      
      return canisterReviews.map(convertCanisterReviewToFrontend);
    } catch (error) {
      console.error('Error getting all reviews:', error);
      throw error;
    }
  },

  /**
   * Get review statistics
   */
  async getReviewStatistics(): Promise<ReviewStatistics> {
    try {
      const actor = await getReviewActor();
      const stats = await actor.getReviewStatistics();
      
      return {
        totalReviews: Number(stats.totalReviews),
        activeReviews: Number(stats.activeReviews),
        hiddenReviews: Number(stats.hiddenReviews),
        flaggedReviews: Number(stats.flaggedReviews),
        deletedReviews: Number(stats.deletedReviews),
      };
    } catch (error) {
      console.error('Error getting review statistics:', error);
      throw error;
    }
  },


  /**
   * Set canister references (admin function)
   */
  async setCanisterReferences(
    booking: string,
    service: string,
    reputation: string,
    auth: string
  ): Promise<string | null> {
    try {
      // Add agent validation
      const agent = await getHttpAgent();
      if (!agent) {
        throw new Error('Failed to get HTTP agent - agent is undefined');
      }
      
      // Create a fresh actor instance with proper error handling
      const actor = Actor.createActor(idlFactory, {
        agent: agent,
        canisterId: REVIEW_CANISTER_ID,
      }) as ReviewService;
      
      if (!actor) {
        throw new Error('Failed to create actor instance');
      }
      
      const result = await actor.setCanisterReferences(
        Principal.fromText(booking),
        Principal.fromText(service),
        Principal.fromText(reputation),
        Principal.fromText(auth)
      );
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Error setting canister references:', result.err);
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error setting canister references:', error);
      // Reset the actor to force recreation on next call
      reviewActor = null;
      throw new Error(`Failed to set canister references: ${error}`);
    }
  },

  /**
   * Get recent reviews
   */
  async getRecentReviews(limit: number = 10): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      const visibleReviews = allReviews.filter(review => review.status === 'Visible');
      
      // Sort by creation date (most recent first)
      visibleReviews.sort((a, b) => b.createdAt - a.createdAt);
      
      return visibleReviews.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent reviews:', error);
      throw error;
    }
  },

  /**
   * Get top rated reviews
   */
  async getTopRatedReviews(limit: number = 10): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      const visibleReviews = allReviews.filter(review => review.status === 'Visible');
      
      // Sort by rating (highest first) and then by quality score
      visibleReviews.sort((a, b) => {
        if (a.rating !== b.rating) {
          return b.rating - a.rating;
        }
        // If ratings are equal, sort by quality score
        const scoreA = a.qualityScore || 0;
        const scoreB = b.qualityScore || 0;
        return scoreB - scoreA;
      });
      
      return visibleReviews.slice(0, limit);
    } catch (error) {
      console.error('Error getting top rated reviews:', error);
      throw error;
    }
  },

  /**
   * Get reviews for a specific provider
   */
  async getProviderReviews(providerId: string): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      return allReviews.filter(review => 
        review.providerId === providerId && review.status === 'Visible'
      );
    } catch (error) {
      console.error('Error getting provider reviews:', error);
      throw error;
    }
  },

  /**
   * Get reviews for a specific service
   */
  async getServiceReviews(serviceId: string): Promise<Review[]> {
    try {
      const allReviews = await this.getAllReviews();
      return allReviews.filter(review => 
        review.serviceId === serviceId && review.status === 'Visible'
      );
    } catch (error) {
      console.error('Error getting service reviews:', error);
      throw error;
    }
  },

  /**
   * Check if user can review a booking
   */
  async canUserReviewBooking(bookingId: string, userId: string): Promise<boolean> {
    try {
      // Get existing reviews for this booking by this user
      const bookingReviews = await this.getBookingReviews(bookingId);
      const userReview = bookingReviews.find(review => review.clientId === userId);
      
      // User can review if they haven't already reviewed this booking
      return !userReview;
    } catch (error) {
      console.error('Error checking if user can review booking:', error);
      return false;
    }
  }
};

// Reset functions for authentication state changes
export const resetReviewActor = () => {
  reviewActor = null;
};

export const refreshReviewActor = async () => {
  resetReviewActor();
  return await getReviewActor();
};

export default reviewCanisterService;
