import React from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { useProviderReviews } from "../../../hooks/reviewManagement";

const CustomerRatingStars: React.FC = () => {
  const { analytics, loading } = useProviderReviews();
  const averageRating = analytics?.averageRating || 0;

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(<StarIcon key={i} className="h-6 w-6 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        // Half star logic (can be a custom icon or creative styling)
        stars.push(
          <div key={i} className="relative h-6 w-6">
            <StarIcon className="absolute left-0 h-6 w-6 text-gray-300" />
            <StarIcon
              className="absolute left-0 h-6 w-6 text-yellow-400"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>,
        );
      } else {
        // Empty star
        stars.push(<StarIcon key={i} className="h-6 w-6 text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return <div>Loading rating...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-800">Customer Rating</h3>
      <div className="flex items-center gap-1">{renderStars()}</div>
      <p className="mt-2 text-sm text-gray-500">
        {averageRating.toFixed(1)} out of 5 stars (
        {analytics?.totalReviews || 0} reviews)
      </p>
    </div>
  );
};

export default CustomerRatingStars;
