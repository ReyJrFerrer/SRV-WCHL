import React from "react";
import { Link } from "react-router-dom";
import {
  StarIcon,
  MapPinIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";
import useServiceById from "../../hooks/serviceDetail";
import { EnrichedService } from "../../hooks/serviceInformation";

interface ServiceListItemProps {
  service: EnrichedService;
  inCategories?: boolean;
  isGridItem?: boolean;
  retainMobileLayout?: boolean;
}

const ServiceListItem: React.FC<ServiceListItemProps> = React.memo(
  ({ service, isGridItem = false, retainMobileLayout = false }) => {
    // Fetch the latest service data to get isVerified
    const { service: fetchedService } = useServiceById(service.id);
    const isVerified = fetchedService?.isVerified === true;
    // Use service rating data directly from props instead of loading it individually
    const serviceRating = {
      average: service.rating?.average || 0,
      count: service.rating?.count || 0,
      loading: false,
    };

    // Define layout classes based on props
    const itemWidthClass = isGridItem
      ? "w-full" // Full width for grid items
      : "w-full"; // Default width for list items

    // Determine availability status (simplified since we may not have full availability data)
    const isAvailable = service.availability?.isAvailable ?? false;
    const availabilityText = isAvailable ? "Available" : "Not Available";

    const priceLocationContainerClass = retainMobileLayout
      ? "flex flex-row justify-between items-center mt-auto pt-2 border-t border-gray-100" // Price and Location on same line
      : "flex flex-col items-start sm:flex-row sm:justify-between sm:items-center mt-auto pt-2 border-t border-gray-100"; // Default responsive

    const priceMarginClass = !retainMobileLayout ? "mb-0.5 sm:mb-0" : "";

    // Helper function to render rating stars
    const renderRatingStars = (rating: number, size: string = "h-3 w-3") => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      return (
        <div className="flex items-center">
          {/* Full stars */}
          {Array.from({ length: fullStars }, (_, i) => (
            <StarIcon key={`full-${i}`} className={`${size} text-yellow-400`} />
          ))}

          {/* Half star */}
          {hasHalfStar && (
            <div className="relative">
              <StarIcon className={`${size} text-gray-300`} />
              <div className="absolute inset-0 w-1/2 overflow-hidden">
                <StarIcon className={`${size} text-yellow-400`} />
              </div>
            </div>
          )}

          {/* Empty stars */}
          {Array.from({ length: emptyStars }, (_, i) => (
            <StarIcon key={`empty-${i}`} className={`${size} text-gray-300`} />
          ))}
        </div>
      );
    };

    // Category icon mapping
    const categoryIconMap: Record<string, string> = {
      "gadget-technicians": "gadget repair.svg",
      "beauty-services": "Beauty Services.svg",
      "home-services": "repairs.svg",
      "beauty-wellness": "wellnes.svg",
      "automobile-repairs": "auto.svg",
      "cleaning-services": "cleaning.svg",
      "delivery-errands": "delivery.svg",
      photographer: "photography.svg",
      tutoring: "tutor.svg",
      others: "others.svg",
    };

    // Normalize slug for mapping
    const getCategoryIcon = (slug: string | undefined): string => {
      if (!slug) return "/images/categories/others.svg";
      // Handle special cases for mapping
      if (categoryIconMap[slug]) {
        return `/images/categories/${categoryIconMap[slug]}`;
      }
      // Fallback: try replacing hyphens with spaces and capitalize
      const fallback = `/images/categories/${slug.replace(/-/g, " ")}.svg`;
      return fallback;
    };

    return (
      <Link
        to={`/client/service/${service.id}`}
        className={`service-card block ${itemWidthClass} group flex flex-col overflow-hidden`}
      >
        <div className="relative">
          {/* Image container */}
          <div className="aspect-video w-full">
            <img
              src={
                service.providerAvatar ||
                (service.category?.slug
                  ? `/images/ai-sp/${service.category.slug}.svg`
                  : "/default-provider.svg")
              }
              alt={service.title}
              className="service-image h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // If .png fails, try .webp, then fallback to svg
                const slug = service.category?.slug;
                const triedWebp = e.currentTarget.dataset.triedWebp === "true";
                if (
                  slug &&
                  !triedWebp &&
                  e.currentTarget.src.includes(`${slug}.png`)
                ) {
                  e.currentTarget.src = `/images/ai-sp/${slug}.png`;
                  e.currentTarget.dataset.triedWebp = "true";
                } else if (
                  e.currentTarget.src !==
                  window.location.origin + "/default-provider.svg"
                ) {
                  e.currentTarget.src = "/default-provider.svg";
                }
              }}
            />
          </div>
          {/* Category icon and availability badge row */}
          <div className="pointer-events-none absolute top-2 right-2 left-2 flex items-center justify-between">
            {/* Category icon (if available) */}
            {service.category?.slug && (
              <img
                src={getCategoryIcon(service.category.slug)}
                alt={service.category.name || "Category"}
                className="h-8 w-8 rounded-full border border-gray-200 bg-white shadow"
                title={service.category.name}
                onError={(e) => {
                  e.currentTarget.src = "/images/categories/others.svg";
                }}
              />
            )}
            {/* Availability badge */}
            <div
              className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow ${isAvailable ? "bg-green-500" : "bg-red-500"}`}
              style={{ marginLeft: "auto" }}
            >
              {availabilityText}
            </div>
          </div>
        </div>

        <div className="service-content flex flex-grow flex-col p-3">
          <div className="flex-grow">
            {/* Service title at the top */}
            <p className="text-md mb-1 truncate leading-tight font-bold text-blue-800 transition-colors duration-200 group-hover:text-yellow-500">
              {service.title}
            </p>
            {/* Provider name below service title, with blue check if verified */}
            <p className="mb-2 flex items-center gap-1 truncate text-sm text-blue-700">
              {service.providerName}
              {isVerified && (
                <CheckBadgeIcon
                  className="ml-1 h-4 w-4 text-blue-500"
                  title="Verified provider"
                />
              )}
            </p>

            {/* Location info - city/address if available */}
            {service.location &&
              (service.location.city || service.location.address) && (
                <div className="mb-2 flex items-center text-xs text-blue-700">
                  <MapPinIcon className="mr-0.5 h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {service.location.city || service.location.address}
                    {service.location.state
                      ? `, ${service.location.state}`
                      : ""}
                    {service.location.serviceRadius &&
                      service.location.serviceRadiusUnit && (
                        <>
                          {" "}
                          ( {service.location.serviceRadius}{" "}
                          {service.location.serviceRadiusUnit} )
                        </>
                      )}
                  </span>
                </div>
              )}
          </div>

          <div className={priceLocationContainerClass}>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={`text-lg font-bold text-blue-800 ${priceMarginClass} flex items-center gap-2`}
              >
                {`₱${service.price.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              </p>
              <div className="flex items-center text-xs text-blue-800">
                {serviceRating.count > 0 ? (
                  <>
                    {renderRatingStars(serviceRating.average, "h-4 w-4")}
                    <span className="ml-1 font-semibold">
                      {serviceRating.average.toFixed(1)}
                    </span>
                    <span className="ml-1 text-gray-500">
                      ({serviceRating.count})
                    </span>
                  </>
                ) : (
                  <div className="flex items-center text-gray-400">
                    {renderRatingStars(0, "h-4 w-4")}
                    <span className="ml-1">No reviews</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  },
);

export default ServiceListItem;
