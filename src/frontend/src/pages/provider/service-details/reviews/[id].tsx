import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ArrowLeftIcon, StarIcon as StarSolid, UserIcon, EyeSlashIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { useServiceReviews } from '../../../../hooks/reviewManagement';
import { useServiceById } from '../../../../hooks/serviceInformation';
import { useProviderBookingManagement } from '../../../../hooks/useProviderBookingManagement';

const StarRatingDisplay: React.FC<{ rating: number; maxStars?: number }> = ({ 
  rating, 
  maxStars = 5 
}) => {
  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <StarSolid
            key={index}
            className={`h-5 w-5 ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        );
      })}
    </div>
  );
};

const ServiceReviewsPage: React.FC = () => {
  const router = useRouter();
  const { id: serviceId } = router.query;

  // Get service data with provider information
  const { 
    service, 
    loading: serviceLoading, 
    error: serviceError 
  } = useServiceById(serviceId as string);

  // Get provider authentication info
  const { 
    isProviderAuthenticated,
    providerProfile
  } = useProviderBookingManagement();

  // Get reviews using the review management hook
  const {
    reviews,
    loading: reviewsLoading,
    error: reviewsError,
    analytics,
    getAverageRating,
    getRatingDistribution,
    formatReviewDate,
    getRelativeTime,
    refreshReviews
  } = useServiceReviews(serviceId as string);


  // Local state for filtering and sorting
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showHiddenReviews, setShowHiddenReviews] = useState(false);

  // Check if current user is the service provider
  const isServiceOwner = React.useMemo(() => {
    if (!service || !providerProfile) return false;
    return service.providerId === providerProfile.id;
  }, [service, providerProfile]);

  // Computed values
  const sortedAndFilteredReviews = React.useMemo(() => {
    let filtered = reviews;
    
    // Filter by visibility (providers can see all reviews, clients only see visible ones)
    if (!isServiceOwner) {
      filtered = reviews.filter(review => review.status === 'Visible');
    } else if (!showHiddenReviews) {
      filtered = reviews.filter(review => review.status === 'Visible');
    }
    
    // Filter by rating if selected
    if (filterRating) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    // Sort reviews
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [reviews, sortBy, filterRating, isServiceOwner, showHiddenReviews]);

  const ratingDistribution = getRatingDistribution(reviews);
  const averageRating = getAverageRating(reviews);
  const visibleReviews = reviews.filter(review => review.status === 'Visible');
  const hiddenReviews = reviews.filter(review => review.status === 'Hidden');
  const flaggedReviews = reviews.filter(review => review.status === 'Flagged');

  if (serviceLoading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-700">Loading reviews...</p>
      </div>
    );
  }

  if (serviceError || reviewsError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Reviews</h1>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Service Not Found</h1>
        <p className="text-gray-600 mb-6">We couldn't find the service you were looking for.</p>
        <button
          onClick={() => router.push(isServiceOwner ? '/provider/home' : '/client/home')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const providerName = service.providerName || 'Service Provider';
  const providerAvatar = service.providerAvatar;

  return (
    <>
      <Head>
        <title>SRV | Reviews for {service.name} by {providerName}</title>
        <meta name="description" content={`Read reviews for ${service.name} offered by ${providerName}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header for navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 mr-3"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800 truncate">
                {isServiceOwner ? 'My Service Reviews' : `Reviews for ${service.name}`}
              </h1>
            </div>
            <button
              onClick={refreshReviews}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              title="Refresh reviews"
            >
              🔄
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto p-4">
          {/* Service Info Card */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6 flex items-center space-x-4"> 
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <Image
                src={providerAvatar} 
                alt={providerName}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-grow">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{providerName}</h2>
              <p className="text-sm md:text-md text-gray-600 mb-1">{service.name}</p>
              <div className="flex items-center space-x-1 text-xs md:text-sm text-gray-700">
                <StarRatingDisplay rating={averageRating} />
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <span>({visibleReviews.length} reviews)</span>
              </div>
              {isServiceOwner && (
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                  <span className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1 text-green-600" />
                    {visibleReviews.length} Visible
                  </span>
                  {hiddenReviews.length > 0 && (
                    <span className="flex items-center">
                      <EyeSlashIcon className="h-4 w-4 mr-1 text-yellow-600" />
                      {hiddenReviews.length} Hidden
                    </span>
                  )}
                  {flaggedReviews.length > 0 && (
                    <span className="flex items-center">
                      🚩 {flaggedReviews.length} Flagged
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rating Summary and Filters */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Breakdown</h3>
            
            {/* Rating Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Rating Distribution</h4>
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="flex items-center mb-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mx-3">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ 
                          width: `${reviews.length > 0 ? (ratingDistribution[rating] / reviews.length) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">
                      {ratingDistribution[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Reviews:</span>
                    <span className="font-semibold">{reviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Rating:</span>
                    <span className="font-semibold">{averageRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>5-Star Reviews:</span>
                    <span className="font-semibold">{ratingDistribution[5] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Reviews (7 days):</span>
                    <span className="font-semibold">{analytics?.recentReviews || 0}</span>
                  </div>
                  {isServiceOwner && (
                    <>
                      <div className="flex justify-between">
                        <span>Visible Reviews:</span>
                        <span className="font-semibold text-green-600">{visibleReviews.length}</span>
                      </div>
                      {hiddenReviews.length > 0 && (
                        <div className="flex justify-between">
                          <span>Hidden Reviews:</span>
                          <span className="font-semibold text-yellow-600">{hiddenReviews.length}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Filters and Sorting */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter by rating:</label>
                <select
                  value={filterRating || ''}
                  onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Provider-only: Show hidden reviews toggle */}
              {isServiceOwner && hiddenReviews.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showHidden"
                    checked={showHiddenReviews}
                    onChange={(e) => setShowHiddenReviews(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showHidden" className="text-sm font-medium text-gray-700">
                    Show hidden reviews
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Reviews List */}
          {sortedAndFilteredReviews.length > 0 ? (
            <div className="space-y-4">
              {sortedAndFilteredReviews.map((review) => (
                <div 
                  key={review.id} 
                  className={`bg-white p-4 rounded-lg shadow ${
                    review.status !== 'Visible' ? 'border-l-4 border-yellow-400' : ''
                  }`}
                >
                  <div className="flex items-start mb-3"> 
                    <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0 border border-gray-100 bg-gray-200 flex items-center justify-center">
                      {review.clientProfile?.profilePicture?.imageUrl ? (
                        <Image
                          src={"./images/rey.png"} 
                          alt={review.clientName || 'Client'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <UserIcon className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">
                          {review.clientName || 'Anonymous User'}
                        </h4>
                        {review.status !== 'Visible' && (
                          <div className="flex items-center text-xs text-gray-500">
                            <EyeSlashIcon className="h-4 w-4 mr-1" />
                            {review.status}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">
                          {formatReviewDate(review.createdAt)}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">
                          {getRelativeTime(review.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <StarRatingDisplay rating={review.rating} />
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.comment}</p>
                  
                  {/* Quality Score */}
                  {review.qualityScore && (
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <span>Quality Score: {(review.qualityScore * 100).toFixed(0)}%</span>
                    </div>
                  )}

                  {/* Provider Actions */}
                  {isServiceOwner && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">Provider actions:</span>
                      {review.status === 'Visible' && (
                        <button className="text-xs text-yellow-600 hover:underline">
                          Hide Review
                        </button>
                      )}
                      {review.status === 'Hidden' && (
                        <button className="text-xs text-green-600 hover:underline">
                          Show Review
                        </button>
                      )}
                      <span className="text-xs text-gray-300">•</span>
                      <button className="text-xs text-red-600 hover:underline">
                        Flag Review
                      </button>
                    </div>
                  )}

                  {/* Client Actions (if owned by current user) */}
                  {review.canEdit && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                      <button className="text-xs text-blue-600 hover:underline">
                        Edit Review
                      </button>
                      <span className="text-xs text-gray-300">•</span>
                      <button className="text-xs text-red-600 hover:underline">
                        Delete Review
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow">
              <p className="text-gray-600">
                {filterRating 
                  ? `No ${filterRating}-star reviews found.`
                  : 'No reviews yet for this service.'
                }
              </p>
              {filterRating && (
                <button
                  onClick={() => setFilterRating(null)}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ServiceReviewsPage;