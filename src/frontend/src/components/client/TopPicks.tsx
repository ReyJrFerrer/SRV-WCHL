import React from "react";
import { Link } from "react-router-dom";
import ServiceListItem from "./ServiceListItem";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import {
  EnrichedService,
  useTopPickServices,
} from "../../hooks/serviceInformation";
import { getCategoryImage } from "../../utils/serviceHelpers";

interface TopPicksProps {
  className?: string;
  limit?: number;
}

const TopPicks: React.FC<TopPicksProps> = ({ className = "", limit = 4 }) => {
  // Use our custom hook to fetch top pick services
  const { services } = useTopPickServices(limit);

  // Use the EnrichedService directly, but update heroImage using category helper
  const enhanceService = (service: EnrichedService): EnrichedService => ({
    ...service,
    heroImage: getCategoryImage(service.category.name),
  });

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold sm:text-xl">Magbook Na!</h2>
        <Link
          to="/client/service/view-all"
          className="flex items-center text-blue-600 transition-colors hover:text-amber-700"
        >
          <span className="mr-1">View All</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {services.length === 0 ? (
        // Empty state
        <div className="py-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <p className="text-gray-500">No services available at the moment</p>
          </div>
        </div>
      ) : (
        // Service grid with responsive sizing
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {services.map((service) => (
            <div key={service.id}>
              <ServiceListItem service={enhanceService(service)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopPicks;
