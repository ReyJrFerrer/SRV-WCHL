import React from "react";
import ServiceListItem from "./ServiceListItem"; // Your individual card component
import {
  EnrichedService,
  useAllServicesWithProviders,
} from "../../hooks/serviceInformation";
import { getCategoryImage } from "../../utils/serviceHelpers";

interface ServicesListProps {
  className?: string;
}

const ServicesList: React.FC<ServicesListProps> = ({ className = "" }) => {
  const { services, loading, error } = useAllServicesWithProviders();

  const enhanceService = (service: EnrichedService): EnrichedService => ({
    ...service,
    heroImage: getCategoryImage(service.category.name),
    providerName: service.providerName,
    providerAvatar: service.providerAvatar,
    rating: {
      average: service.rating.average ?? 0,
      count: service.rating.count ?? 0,
    },
    price: {
      amount: service.price.amount,
      unit: service.price.unit,
      display: `₱${service.price.amount.toFixed(2)}`,
    },
    location: {
      serviceRadius: service.location?.serviceRadius,
      address: service.location?.address,
      city: service.location?.city,
      state: service.location?.state,
      serviceRadiusUnit: service.location?.serviceRadiusUnit,
    },
  });

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <h2 className="mb-4 h-7 w-1/3 animate-pulse rounded-md bg-gray-200 text-lg font-bold sm:text-xl"></h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-64 w-full animate-pulse rounded-lg bg-gray-200"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <h2 className="mb-4 text-lg font-bold sm:text-xl">Magbook Na!</h2>
        <p className="text-red-500">Error loading services: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold sm:text-xl">Magbook Na!</h2>
      </div>

      {services.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            No top-rated services available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
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

export default ServicesList;
