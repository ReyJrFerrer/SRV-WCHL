import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  ArrowLeftIcon,
  StarIcon as StarSolid,
  UserIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { useServiceReviews } from "../../../../hooks/reviewManagement";
import { useServiceById } from "../../../../hooks/serviceInformation";
import { review } from "@app/declarations/review";

const StarRatingDisplay: React.FC<{ rating: number; maxStars?: number }> = ({
  rating,
  maxStars = 5,
}) => {
  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <StarSolid
            key={index}
            className={`h-5 w-5 ${starValue <= rating ? "text-yellow-400" : "text-gray-300"}`}
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
    error: serviceError,
  } = useServiceById(serviceId as string);

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
    refreshReviews,
  } = useServiceReviews(serviceId as string);

  // Local state for filtering and sorting
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Computed values
  const sortedAndFilteredReviews = React.useMemo(() => {
    let filtered = reviews.filter((review) => review.status === "Visible");

    // Filter by rating if selected
    if (filterRating) {
      filtered = filtered.filter((review) => review.rating === filterRating);
    }

    // Sort reviews
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [reviews, sortBy, filterRating]);

  const ratingDistribution = getRatingDistribution(reviews);
  const averageRating = getAverageRating(reviews);

  if (serviceLoading || reviewsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-700">Loading reviews...</p>
      </div>
    );
  }

  if (serviceError || reviewsError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Error Loading Reviews
        </h1>
        {/* <p className="text-gray-600 mb-6">{serviceError! || reviewsError!}</p> */}
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Service Not Found
        </h1>
        <p className="mb-6 text-gray-600">
          We couldn't find the service you were looking for.
        </p>
        <button
          onClick={() => router.push("/client/home")}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const providerName = service.providerName || "Service Provider";
  const providerAvatar = "/images/rey.png";

  return (
    <>
      <Head>
        <title>
          SRV | Reviews for {service.name} by {providerName}
        </title>
        <meta
          name="description"
          content={`Read reviews for ${service.name} offered by ${providerName}`}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header for navigation */}
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-3 rounded-full p-2 hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
              </button>
              <h1 className="truncate text-lg font-semibold text-gray-800">
                Reviews for {service.name}
              </h1>
            </div>
            <button
              onClick={refreshReviews}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
              title="Refresh reviews"
            >
              🔄
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto p-4">
          {/* Service Info Card */}
          <div className="mb-6 flex items-center space-x-4 rounded-lg bg-white p-4 shadow-md md:p-6">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 md:h-20 md:w-20">
              <Image
                src={providerAvatar}
                alt={providerName}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-grow">
              <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
                {providerName}
              </h2>
              <p className="md:text-md mb-1 text-sm text-gray-600">
                {service.name}
              </p>
              <div className="flex items-center space-x-1 text-xs text-gray-700 md:text-sm">
                <StarRatingDisplay rating={averageRating} />
                <span className="font-semibold">
                  {averageRating.toFixed(1)}
                </span>
                <span>({reviews.length} reviews)</span>
              </div>
            </div>
          </div>

          {/* Rating Summary and Filters */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow-md md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Rating Breakdown
            </h3>

            {/* Rating Distribution */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-3 font-medium text-gray-700">
                  Rating Distribution
                </h4>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="mb-2 flex items-center">
                    <span className="w-8 text-sm">{rating}★</span>
                    <div className="mx-3 h-2 flex-1 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-yellow-400"
                        style={{
                          width: `${reviews.length > 0 ? (ratingDistribution[rating] / reviews.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <span className="w-12 text-sm text-gray-600">
                      {ratingDistribution[rating] || 0}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="mb-3 font-medium text-gray-700">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Reviews:</span>
                    <span className="font-semibold">{reviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Rating:</span>
                    <span className="font-semibold">
                      {averageRating.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>5-Star Reviews:</span>
                    <span className="font-semibold">
                      {ratingDistribution[5] || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Reviews (7 days):</span>
                    <span className="font-semibold">
                      {analytics?.recentReviews || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Sorting */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter by rating:
                </label>
                <select
                  value={filterRating || ""}
                  onChange={(e) =>
                    setFilterRating(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {sortedAndFilteredReviews.length > 0 ? (
            <div className="space-y-4">
              {sortedAndFilteredReviews.map((review) => (
                <div key={review.id} className="rounded-lg bg-white p-4 shadow">
                  <div className="mb-3 flex items-start">
                    <div className="relative mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-gray-200">
                      {review.clientProfile?.profilePicture?.imageUrl ? (
                        <Image
                          src={review.clientProfile.profilePicture.imageUrl}
                          alt={review.clientName || "Client"}
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
                          {review.clientName || "Anonymous User"}
                        </h4>
                        {review.status !== "Visible" && (
                          <div className="flex items-center text-xs text-gray-500">
                            <EyeSlashIcon className="mr-1 h-4 w-4" />
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

                  <p className="mb-3 text-sm leading-relaxed text-gray-700">
                    {review.comment}
                  </p>

                  {/* Quality Score */}
                  {review.qualityScore && (
                    <div className="mb-2 flex items-center text-xs text-gray-500">
                      <span>
                        Quality Score: {(review.qualityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}

                  {/* Review Actions (if owned by current user) */}
                  {review.canEdit && (
                    <div className="flex items-center space-x-2 border-t border-gray-100 pt-2">
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
            <div className="rounded-lg bg-white py-10 text-center shadow">
              <p className="text-gray-600">
                {filterRating
                  ? `No ${filterRating}-star reviews found.`
                  : "No reviews yet for this service."}
              </p>
              {filterRating && (
                <button
                  onClick={() => setFilterRating(null)}
                  className="mt-2 text-sm text-blue-600 hover:underline"
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
