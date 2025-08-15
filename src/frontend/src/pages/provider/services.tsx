import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  StarIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import {
  EnhancedService,
  useServiceManagement,
} from "../../hooks/serviceManagement";
import BottomNavigation from "../../components/provider/BottomNavigation";

// Helper to get category image path
const getCategoryImage = (slugOrName?: string) => {
  if (!slugOrName) return "/images/categories/others.svg";
  const slug = slugOrName.toLowerCase().replace(/\s+/g, "-");
  return `/images/categories/${slug}.svg`;
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "Available":
      return { text: "Active", className: "bg-green-100 text-green-700" };
    case "Suspended":
      return { text: "Suspended", className: "bg-yellow-100 text-yellow-700" };
    case "Unavailable":
      return { text: "Inactive", className: "bg-red-100 text-red-700" };
    default:
      return { text: "Unknown", className: "bg-gray-100 text-gray-600" };
  }
};

// Try to get up to 3 gallery image keys for the service

const ServiceGalleryImage: React.FC<{ service: EnhancedService }> = ({
  service,
}) => (
  <img
    src={`/images/ai-sp/${service.category?.slug || "ai-sp-1"}.svg`}
    alt={service.title}
    className="mb-2 h-32 w-full rounded-xl object-cover"
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = "/images/ai-sp/default-provider.svg";
    }}
  />
);

const MyServicesPage: React.FC = () => {
  const { userServices, loading, error, refreshServices } =
    useServiceManagement();

  useEffect(() => {
    document.title = "My Services | SRV Provider";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-yellow-50 pb-16 md:pb-0">
      <header className="sticky top-0 z-20 bg-white px-4 py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            My Services
          </h1>
          <Link
            to="/provider/services/add"
            className="flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:px-4"
            aria-label="Add new service"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="ml-1 hidden sm:inline">Add new service</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto flex-grow p-6 pb-10">
        <div className="mt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-500">Loading your services...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-red-500">{error}</p>
              <button
                onClick={refreshServices}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : userServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {userServices.map((service) => {
                const statusDisplay = getStatusDisplay(service.status);
                const categoryImage = getCategoryImage(
                  service.category?.slug || service.category?.name,
                );

                return (
                  <Link
                    key={service.id}
                    to={`/provider/service-details/${service.id}`}
                    className="group relative flex flex-col items-center rounded-2xl border border-blue-100 bg-white p-6 shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Service gallery image at the top */}
                    <div className="relative flex w-full flex-col items-center">
                      <ServiceGalleryImage service={service} />
                      {/* Category image at top left of service image */}
                      <img
                        src={categoryImage}
                        alt="Category"
                        className="absolute top-2 left-2 h-10 w-10 rounded-full border-2 border-white bg-white object-cover shadow"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/categories/others.svg";
                        }}
                      />
                      {/* Status badge at top right of service image */}
                      <span
                        className={`absolute top-2 right-2 rounded-full px-3 py-1 text-xs font-semibold shadow ${statusDisplay.className}`}
                      >
                        {statusDisplay.text}
                      </span>
                    </div>
                    {/* Service Name */}
                    <h4 className="mt-3 w-full text-center text-lg font-bold text-blue-900">
                      {service.title}
                    </h4>
                    {/* Price and Ratings */}
                    <div className="mt-2 flex w-full items-center justify-center gap-4">
                      <span className="flex items-center gap-1 text-yellow-400">
                        <StarIcon className="h-5 w-5" />
                        <span className="font-semibold text-yellow-500">
                          {service.averageRating || "0"} / 5{" "}
                          <span className="text-gray-400">
                            ({service.reviewCount})
                          </span>
                        </span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <WrenchScrewdriverIcon className="mx-auto mb-3 h-14 w-14 text-gray-300" />
              <p className="mb-2 text-lg">
                You haven't listed any services yet.
              </p>
              <Link
                to="/provider/services/add"
                className="mt-2 inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Add your first service
              </Link>
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default MyServicesPage;
