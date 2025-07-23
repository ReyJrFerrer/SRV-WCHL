import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  StarIcon,
  MapPinIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/solid";
import { CameraIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

import useServiceById from "../../hooks/serviceDetail"; // Adjusted hook import
import { useServiceReviews } from "../../hooks/reviewManagement"; // Adjust path as needed
import { useServiceManagement } from "../../hooks/serviceManagement"; // Using the service management hook
import BottomNavigation from "../../components/client/BottomNavigation"; // Adjust path as needed
import { ServicePackage } from "../../services/serviceCanisterService";

// --- Sub-component for Star Rating Display ---
const StarRatingDisplay: React.FC<{ rating: number; maxStars?: number }> = ({
  rating,
  maxStars = 5,
}) => {
  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <StarIcon
            key={index}
            className={`h-5 w-5 ${starValue <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
          />
        );
      })}
    </div>
  );
};

// --- Sub-component for the Reviews Section ---
const ReviewsSection: React.FC<{ serviceId: string }> = ({ serviceId }) => {
  const { reviews, loading, error, getAverageRating, getRatingDistribution } =
    useServiceReviews(serviceId);

  if (loading)
    return (
      <div className="p-4 text-center text-gray-500">Loading reviews...</div>
    );
  if (error)
    return (
      <div className="p-4 text-center text-red-500">
        Could not load reviews.
      </div>
    );

  const visibleReviews = reviews.filter((r) => r.status === "Visible");
  const averageRating = getAverageRating(visibleReviews);
  const ratingDistribution = getRatingDistribution(visibleReviews);
  const totalReviews = visibleReviews.length;

  return (
    <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Reviews ({totalReviews})
      </h3>
      {totalReviews > 0 ? (
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
            <div className="mb-6 text-center lg:mb-0">
              <p className="text-4xl font-bold text-gray-800">
                {averageRating.toFixed(1)}
              </p>
              <div className="flex justify-center">
                <StarRatingDisplay rating={averageRating} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                based on {totalReviews} reviews
              </p>
            </div>
            <div className="flex-1">
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star] || 0;
                  const percentage =
                    totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center text-sm">
                      <span className="w-12 text-gray-600">
                        {star} star{star > 1 ? "s" : ""}
                      </span>
                      <div className="mx-3 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-right text-gray-600">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-6">
            {visibleReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-t border-gray-100 pt-6">
                <div className="mb-2 flex items-center">
                  <div className="relative mr-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                    <UserCircleIcon className="h-10 w-10 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">A Client</p>
                    <div className="flex items-center">
                      <StarRatingDisplay rating={review.rating} />
                    </div>
                  </div>
                </div>
                <p className="text-sm break-words text-gray-600">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No reviews yet for this service.
        </p>
      )}
    </div>
  );
};

// --- Other Sub-Components ---
const ServiceGallerySection: React.FC = () => (
  <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
    <h3 className="mb-4 text-lg font-semibold text-gray-800">
      Service Gallery
    </h3>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex aspect-square items-center justify-center rounded-lg bg-gray-100"
        >
          <CameraIcon className="h-10 w-10 text-gray-300" />
        </div>
      ))}
    </div>
    <p className="mt-4 text-center text-xs text-gray-500">
      The service provider will add photos of their work soon.
    </p>
  </div>
);

const CredentialsSection: React.FC<{ isVerified: boolean }> = ({
  isVerified,
}) => (
  <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
    <h3 className="mb-4 text-lg font-semibold text-gray-800">Credentials</h3>
    <div className="flex items-center rounded-lg bg-gray-50 p-4">
      <DocumentCheckIcon className="mr-4 h-10 w-10 text-gray-400" />
      <div>
        <p className="font-semibold text-gray-700">
          {isVerified ? "Provider Verified" : "Verification Pending"}
        </p>
        <p className="text-sm text-gray-500">
          {isVerified
            ? "Credentials have been successfully verified."
            : "Credentials will be displayed here once verified."}
        </p>
      </div>
    </div>
  </div>
);

// --- Main Page Component ---
const ServiceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: serviceId } = useParams<{ id: string }>();

  const {
    service,
    loading: serviceLoading,
    error: serviceError,
  } = useServiceById(serviceId as string);
  const { getServicePackages } = useServiceManagement(); // Use the hook for package fetching
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);

  useEffect(() => {
    if (service) {
      document.title = `SRV | ${service.name}`;
    }
  }, [service]);

  useEffect(() => {
    const fetchPackages = async () => {
      if (service?.id) {
        setLoadingPackages(true);
        try {
          // Fetch packages using the centralized hook
          const fetchedPackages = await getServicePackages(service.id);
          setPackages(fetchedPackages);
        } catch (error) {
          console.error("Failed to fetch service packages:", error);
        } finally {
          setLoadingPackages(false);
        }
      }
    };
    fetchPackages();
  }, [service?.id, getServicePackages]);

  const handleBookNow = () => {
    if (!service) return;
    navigate(`/client/book/${service.id}`);
  };

  const handleChatProviderClick = () => {
    if (!service?.providerId) {
      alert("Provider information is missing.");
      return;
    }
    navigate(`/client/chat/${service.providerId}`, {
      state: {
        providerName: service.providerName,
        providerImage: service.providerAvatar || "/images/default-avatar.png",
        providerAvailability: service.availability.isAvailableNow
          ? "Available Now"
          : "Not Available",
      },
    });
  };

  if (serviceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (serviceError || !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          {serviceError ? "Error Loading Service" : "Service Not Found"}
        </h1>
        <button
          onClick={() => navigate("/client/home")}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const {
    rating,
    providerName,
    providerAvatar,
    isVerified,
    name,
    category,
    location,
    description,
  } = service;
  const averageRating = rating?.average ?? 0;
  const reviewCount = rating?.count ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="relative h-60 w-full">
        <img
          src={service.heroImage || "/images/default-service.png"}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="relative z-10 -mt-24 p-4">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1">
            <div className="h-full rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center">
                <div className="relative mr-4 h-16 w-16 overflow-hidden rounded-full border-2 border-white">
                  <img
                    src={providerAvatar || "/images/default-avatar.png"}
                    alt={providerName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {providerName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {category?.name ?? "General"}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <StarIcon className="mr-1 h-5 w-5 text-yellow-400" />
                <span className="font-semibold">
                  {averageRating.toFixed(1)}
                </span>
                <span className="ml-1">({reviewCount} reviews)</span>
              </div>
              {isVerified && (
                <div className="mt-4 flex items-center rounded-lg bg-blue-50 p-3 text-sm text-blue-600">
                  <CheckBadgeIcon className="mr-2 h-5 w-5" />
                  <span>This service provider is verified.</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="mt-6 lg:col-span-2 lg:mt-0">
            <div className="h-full rounded-xl bg-white p-6 shadow-lg">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">{name}</h1>
              <div className="mb-4 flex items-center text-sm text-gray-600">
                <MapPinIcon className="mr-1 h-5 w-5 text-gray-400" />
                <span>{location?.address || "Baguio City"}</span>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  About this service
                </h3>
                <p className="leading-relaxed text-gray-600">{description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Section */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Packages Offered
          </h3>
          {loadingPackages ? (
            <div className="p-4 text-center text-gray-500">
              Loading packages...
            </div>
          ) : packages.length > 0 ? (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">{pkg.title}</h4>
                    <p className="text-lg font-bold text-blue-600">
                      ₱{Number(pkg.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {pkg.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No packages available for this service.
            </div>
          )}
        </div>

        {/* Availability, Location, Gallery, Credentials, Reviews */}
        <ServiceGallerySection />
        <CredentialsSection isVerified={isVerified} />
        <ReviewsSection serviceId={service.id} />
      </div>

      {/* Sticky Footer for Actions */}
      <div className="shadow-t-lg fixed bottom-16 left-0 z-40 w-full border-t border-gray-200 bg-white p-3">
        <div className="mx-auto flex max-w-3xl items-center space-x-3">
          <button
            onClick={handleChatProviderClick}
            className="flex w-1/3 items-center justify-center rounded-lg bg-gray-200 py-3 font-bold text-gray-800 hover:bg-gray-300"
          >
            <ChatBubbleOvalLeftEllipsisIcon className="mr-2 h-5 w-5" />
            Chat
          </button>
          <button
            onClick={handleBookNow}
            disabled={packages.length === 0}
            className="w-2/3 rounded-lg bg-blue-600 py-3 font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:bg-gray-300"
          >
            Book Now
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ServiceDetailPage;
