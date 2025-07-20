import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FrontendProfile } from "../../services/authCanisterService";
import { FormattedServiceDetail } from "../../hooks/serviceDetail";
import { useServiceReviews } from "../../hooks/reviewManagement";

interface ServiceDetailPageComponentProps {
  service: FormattedServiceDetail | null;
  provider?: FrontendProfile | null;
}

// Service Hero Image Component
const ServiceHeroImage: React.FC<{
  service: any;
  provider?: FrontendProfile | null;
}> = ({ service, provider }) => (
  <div className="relative h-48 w-full overflow-hidden md:h-64 lg:h-96">
    <img
      src={"/images/Technician1.jpg"}
      alt={service.title || service.name}
      className="h-full w-full object-cover"
    />
    {/* Gradient overlay for better text readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:from-black/20"></div>

    {/* Hero content overlay for desktop */}
    <div className="absolute bottom-6 left-8 hidden text-white lg:block">
      <h1 className="mb-2 text-3xl font-bold">{service.name}</h1>
      <div className="flex items-center">
        <p className="mr-4 text-lg opacity-90">{service.category.name}</p>
        <div className="flex items-center rounded-full bg-black/30 px-3 py-1 text-white/90">
          <span className="text-sm">
            By {provider?.name || service.providerName || "Service Provider"}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Service Info Section Component
const ServiceInfoSection: React.FC<{
  service: any;
  provider?: FrontendProfile | null;
}> = ({ service, provider }) => (
  <div className="card mb-6">
    {/* Title only shown on mobile/tablet, hidden on desktop due to hero overlay */}
    <h2 className="mb-1 text-xl font-bold text-gray-800 md:text-2xl lg:hidden">
      {service.title || service.name}
    </h2>

    {/* Provider name for mobile display */}
    <div className="mb-3 flex items-center lg:hidden">
      <div className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
        By {provider?.name || service.providerName || "Service Provider"}
      </div>
      <div className="ml-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-gray-600">
        {service.category.name}
      </div>
    </div>

    <p className="mb-6 text-sm leading-relaxed text-gray-600 md:text-base">
      {service.description}
    </p>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex items-start">
        <span className="mt-0.5 mr-3 text-xl">📍</span>
        <div>
          <span className="block font-medium text-gray-800">Lokasyon</span>
          <span className="block text-sm text-gray-600">
            {service.location.address}
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            Saklaw ng serbisyo: {service.location.serviceRadius}
            {service.location.serviceRadiusUnit}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Service Availability Section Component
const ServiceAvailabilitySection: React.FC<{ service: any }> = ({
  service,
}) => (
  <div className="card mb-6">
    <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800 md:text-xl">
      <span className="mr-2 text-xl">📅</span>
      Availabilidad
    </h3>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <span className="mb-2 block font-medium text-gray-800">Iskedyul</span>
        <div className="flex flex-wrap gap-1">
          {service.availability.schedule.map((day: string, index: number) => (
            <span
              key={index}
              className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700"
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block font-medium text-gray-800">Mga Oras</span>
        <div className="flex flex-wrap gap-1">
          {service.availability.timeSlots.map((slot: string, index: number) => (
            <span
              key={index}
              className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
            >
              {slot}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-4 border-t border-gray-100 pt-4">
      <div
        className={`flex items-center text-sm font-medium ${service.availability.isAvailableNow ? "text-green-600" : "text-red-600"}`}
      >
        <span className="mr-2 text-lg">
          {service.availability.isAvailableNow ? "✅" : "⏰"}
        </span>
        {service.availability.isAvailableNow
          ? "Available Now"
          : "Currently Busy"}
      </div>
    </div>
  </div>
);

// Service Rating Section Component
const ServiceRatingSection: React.FC<{ service: any }> = ({ service }) => {
  const navigate = useNavigate();

  // Use the review management hook to get real rating data
  const {
    reviews,
    loading: reviewsLoading,
    error: reviewsError,
    getAverageRating,
    getRatingDistribution,
  } = useServiceReviews(service?.id);

  // Local state for calculated rating data
  const [serviceRating, setServiceRating] = useState<{
    average: number;
    count: number;
    distribution: Record<number, number>;
  }>({
    average: service?.rating?.average || 0,
    count: service?.rating?.count || 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  // Calculate real rating when reviews are loaded
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const visibleReviews = reviews.filter(
        (review) => review.status === "Visible",
      );
      const average = getAverageRating(visibleReviews);
      const count = visibleReviews.length;
      const distribution = getRatingDistribution(visibleReviews);

      setServiceRating({
        average,
        count,
        distribution,
      });
    } else if (!reviewsLoading && reviews) {
      // No reviews found - set to zero
      setServiceRating({
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }
  }, [reviews, reviewsLoading, getAverageRating, getRatingDistribution]);

  const handleViewReviews = () => {
    // Navigate to reviews page with service ID
    navigate(`/client/service/reviews/${service.id}`);
  };

  // Show loading state
  if (reviewsLoading) {
    return (
      <div className="card mb-6">
        <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800 md:text-xl">
          <span className="mr-2 text-xl">⭐</span>
          Rating & Reviews
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-12 animate-pulse rounded bg-gray-200"></div>
            <div>
              <div className="mb-1 flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="animate-pulse text-gray-300">
                    ★
                  </span>
                ))}
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  // Show error state (fallback to service data)
  if (reviewsError) {
    // Use original service data as fallback
    const fallbackRating = service?.rating || { average: 0, count: 0 };

    return (
      <div className="card mb-6">
        <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800 md:text-xl">
          <span className="mr-2 text-xl">⭐</span>
          Rating & Reviews
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 text-3xl font-bold text-yellow-500">
              {fallbackRating.average.toFixed(1)}
            </span>
            <div>
              <div className="mb-1 flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < Math.floor(fallbackRating.average)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {fallbackRating.count} reviews
              </p>
              <p className="text-xs text-red-500">
                Hindi ma-load ang pinakabagong mga review
              </p>
            </div>
          </div>
          <button
            onClick={handleViewReviews}
            className="btn-secondary px-4 py-2 text-sm transition-colors hover:bg-blue-600 hover:text-white"
          >
            View Reviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800 md:text-xl">
        <span className="mr-2 text-xl">⭐</span>
        Rating & Mga Review
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2 text-3xl font-bold text-yellow-500">
            {serviceRating.average > 0
              ? serviceRating.average.toFixed(1)
              : "0.0"}
          </span>
          <div>
            <div className="mb-1 flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={
                    i < Math.floor(serviceRating.average)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {serviceRating.count}{" "}
              {serviceRating.count === 1 ? "review" : "reviews"}
            </p>
            {/* ✅ Add real-time indicator */}
            {serviceRating.count > 0 && (
              <p className="mt-1 text-xs text-green-600">
                ✅ Live data from {serviceRating.count} verified reviews
              </p>
            )}
            {serviceRating.count === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No reviews yet - be the first to review!
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <button
            onClick={handleViewReviews}
            className="btn-secondary mb-2 px-4 py-2 text-sm transition-colors hover:bg-blue-600 hover:text-white"
          >
            {serviceRating.count > 0 ? "View Reviews" : "See Details"}
          </button>

          {/* ✅ Show rating distribution preview */}
          {serviceRating.count > 0 && (
            <div className="text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>5★</span>
                <div className="h-1 w-8 rounded bg-gray-200">
                  <div
                    className="h-1 rounded bg-yellow-400"
                    style={{
                      width: `${serviceRating.count > 0 ? (serviceRating.distribution[5] / serviceRating.count) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span>{serviceRating.distribution[5]}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>4★</span>
                <div className="h-1 w-8 rounded bg-gray-200">
                  <div
                    className="h-1 rounded bg-yellow-400"
                    style={{
                      width: `${serviceRating.count > 0 ? (serviceRating.distribution[4] / serviceRating.count) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span>{serviceRating.distribution[4]}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// // Service Requirements Section Component
// const ServiceRequirementsSection: React.FC<{ service: any }> = ({ service }) => (
//   <div className="card mb-6">
//     <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
//       <span className="text-xl mr-2">📋</span>
//       Requirements
//     </h3>
//     {service.requirements && service.requirements.length > 0 ? (
//       <ul className="space-y-2">
//         {service.requirements.map((req: string, index: number) => (
//           <li key={index} className="flex items-start">
//             <span className="text-green-500 mr-2 mt-0.5">•</span>
//             <span className="text-sm md:text-base text-gray-600">{req}</span>
//           </li>
//         ))}
//       </ul>
//     ) : (
//       <ul className="space-y-2">
//         <li className="flex items-start">
//           <span className="text-green-500 mr-2 mt-0.5">•</span>
//           <span className="text-sm md:text-base text-gray-600">Service provider will discuss requirements during booking</span>
//         </li>
//         <li className="flex items-start">
//           <span className="text-green-500 mr-2 mt-0.5">•</span>
//           <span className="text-sm md:text-base text-gray-600">Please provide detailed description of your needs</span>
//         </li>
//         <li className="flex items-start">
//           <span className="text-green-500 mr-2 mt-0.5">•</span>
//           <span className="text-sm md:text-base text-gray-600">Ensure availability at scheduled time</span>
//         </li>
//       </ul>
//     )}
//   </div>
// );

// Service Verification Section Component
const ServiceVerificationSection: React.FC<{ isVerified: boolean }> = ({
  isVerified,
}) => (
  <div className="card mb-6 lg:mb-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
    <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800 md:text-xl lg:hidden">
      <span className="mr-2 text-xl">🛡️</span>
      Verification Status
    </h3>
    <div
      className={`flex items-center justify-between rounded-lg p-3 ${isVerified ? "border border-green-200 bg-green-50" : "border border-yellow-200 bg-yellow-50"} lg:p-2`}
    >
      <div className="flex items-center">
        <span
          className={`mr-3 text-lg lg:mr-2 ${isVerified ? "text-green-600" : "text-yellow-600"}`}
        >
          {isVerified ? "✅" : "⚠️"}
        </span>
        <div>
          <span
            className={`font-medium ${isVerified ? "text-green-700" : "text-yellow-700"}`}
          >
            {isVerified ? "Veripikado" : "Hinihintay ang verepikasyon"}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">
            {isVerified
              ? "Verified lahat ng dokumento "
              : "Isinasagawa pa ang pagsusuri ng dokumento"}
          </span>
        </div>
      </div>
      {isVerified && (
        <span className="text-xl text-green-600 lg:text-sm">🏆</span>
      )}
    </div>
  </div>
);

// // Service Images Section Component
// const ServiceImagesSection: React.FC<{ service: any }> = ({ service }) => (
//   <div className="card mb-6">
//     <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
//       <span className="text-xl mr-2">🖼️</span>
//       Service Gallery
//     </h3>
//     {service.media && service.media.length > 0 ? (
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
//         {service.media.map((mediaItem: {url: string, type: string}, index: number) => (
//           <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer">
//             <Image
//               src={mediaItem.url}
//               alt={`${service.title} gallery image ${index + 1}`}
//               width={120}
//               height={120}
//               className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
//             />
//           </div>
//         ))}
//       </div>
//     ) : (
//       <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
//         <span className="text-4xl mb-2 block">📷</span>
//         <p className="text-sm">No additional images available.</p>
//         <p className="text-xs text-gray-400 mt-1">Images will be added by the service provider</p>
//       </div>
//     )}
//   </div>
// );

// Placeholder Service Data
const createPlaceholderService = (): any => ({
  id: "placeholder-service",
  providerId: "placeholder-provider",
  name: "Service Provider",
  title: "Professional Service",
  description:
    "This service provider offers professional services. Detailed information will be available once connected to the backend.",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  price: {
    amount: 1000,
    currency: "PHP",
    unit: "/ Hour",
    isNegotiable: true,
  },
  location: {
    address: "Baguio City, Philippines",
    coordinates: {
      latitude: 16.4095,
      longitude: 120.5975,
    },
    serviceRadius: 10,
    serviceRadiusUnit: "km",
  },
  availability: {
    schedule: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    timeSlots: ["09:00-17:00"],
    isAvailableNow: true,
  },
  rating: {
    average: 4.5,
    count: 15,
  },
  media: [],
  requirements: [
    "Please provide service details during booking",
    "Ensure availability at scheduled time",
    "Payment terms will be discussed",
  ],
  isVerified: false,
  slug: "placeholder-service",
  heroImage: "/images/default-service.png",
  providerName: "Service Provider", // Added provider name
  providerAvatar: null, // Added provider avatar
  priceDisplay: "$1000.00", // Added price display
  category: {
    id: "cat-placeholder",
    name: "General Services",
    description: "General professional services",
    slug: "general-services",
    icon: "service",
    imageUrl: "/images/default-category.png",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});

// Main Service Detail Component
const ServiceDetailPageComponent: React.FC<ServiceDetailPageComponentProps> = ({
  service,
  provider,
}) => {
  const navigate = useNavigate();

  // Use placeholder service if no service is provided
  const placeholderService = createPlaceholderService();

  // Use the service directly if provided, otherwise use placeholder
  const displayService = service || placeholderService;

  const handleBookingRequest = () => {
    // Navigate to booking page with the service slug (works for both real and placeholder data)
    navigate(`/client/book/${displayService.id}`);
  };

  return (
    <div className="bg-gray-50">
      <ServiceHeroImage service={displayService} provider={provider} />

      {/* Content Layout - Full width like home.tsx */}
      <div className="px-4 pt-4 pb-16 lg:px-8 lg:pt-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <ServiceInfoSection service={displayService} provider={provider} />
            <ServiceAvailabilitySection service={displayService} />
            <ServiceRatingSection service={displayService} />
            {/* <ServiceRequirementsSection service={displayService} />
            <ServiceImagesSection service={displayService} /> */}
          </div>

          {/* Sidebar - 1/3 width on desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="card mb-6">
                <h3 className="mb-4 text-xl font-semibold text-gray-800">
                  Ibook itong Serbisyo
                </h3>
                <div className="mb-4">
                  <p className="mb-2 text-sm text-gray-600">Tagapagbigay</p>
                  <div className="flex items-center">
                    {provider?.profilePicture?.imageUrl ||
                    displayService.providerAvatar ? (
                      <img
                        src={
                          provider?.profilePicture?.imageUrl ||
                          displayService.providerAvatar ||
                          "/images/default-avatar.png"
                        }
                        alt={
                          provider?.name ||
                          displayService.providerName ||
                          "Service Provider"
                        }
                        className="mr-3 h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <span className="text-xl">👤</span>
                      </div>
                    )}
                    <div>
                      <span className="block font-medium text-gray-800">
                        {provider?.name ||
                          displayService.providerName ||
                          "Service Provider"}
                      </span>
                      <span className="text-xs text-gray-500">
                        Miyembro simula pa noong{" "}
                        {new Date(displayService.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4 border-t border-gray-100 pt-4">
                  <button
                    onClick={handleBookingRequest}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-green-700"
                  >
                    Ibook na
                  </button>
                  <p className="mt-2 text-center text-xs text-gray-500">
                    "Hindi ka pa sisingilin."
                  </p>
                </div>

                <ServiceVerificationSection
                  isVerified={displayService.isVerified}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile booking button - Only visible on mobile */}
      <div className="fixed right-0 bottom-16 left-0 z-50 border-t border-gray-200 bg-white p-4 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-gray-600">Price:</span>
          <span className="font-semibold text-gray-800">
            {displayService.price.currency === "PHP"
              ? "₱"
              : displayService.price.currency}
            {displayService.price.amount.toFixed(2)} {displayService.price.unit}
          </span>
        </div>
        <button
          onClick={handleBookingRequest}
          className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-green-700"
        >
          Ibook Na
        </button>
      </div>
    </div>
  );
};

export default ServiceDetailPageComponent;
