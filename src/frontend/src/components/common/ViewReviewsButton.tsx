import React from 'react';
import { useRouter } from 'next/router';
import { StarIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ViewReviewsButtonProps {
  serviceId: string;
  averageRating: number;
  totalReviews: number;
  className?: string;
  variant?: 'button' | 'card';
}

const ViewReviewsButton: React.FC<ViewReviewsButtonProps> = ({
  serviceId,
  averageRating,
  totalReviews,
  className = '',
  variant = 'button'
}) => {
  const router = useRouter();

  const handleViewReviews = () => {
    router.push(`/provider/service-details/reviews/${serviceId}`);
  };

  if (variant === 'card') {
    return (
      <div 
        onClick={handleViewReviews}
        className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="font-semibold text-gray-800">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600">({totalReviews} reviews)</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Tignan lahat ng ratings and reviews</p>
          </div>
          <EyeIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleViewReviews}
      className={`flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
    >
      <EyeIcon className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        Tignan ang mga Reviews ({totalReviews})
      </span>
    </button>
  );
};

export default ViewReviewsButton;