import React, { useEffect } from 'react';
import Link from 'next/link';
import ServiceListItem from './ServiceListItemNextjs';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { EnrichedService, useTopPickServices } from '@app/hooks/serviceInformation';
import { getCategoryImage } from '@app/utils/serviceHelpers';

interface TopPicksProps {
  className?: string;
  limit?: number;
}

const TopPicks: React.FC<TopPicksProps> = ({ className = '', limit = 4 }) => {
  // Use our custom hook to fetch top pick services
  const { services, loading, error } = useTopPickServices(limit);
  
  // Use the EnrichedService directly, but update heroImage using category helper
  const enhanceService = (service: EnrichedService): EnrichedService => ({
    ...service,
    heroImage: getCategoryImage(service.category.name)
  });

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold">Magbook Na!</h2>
        <Link 
          href="/client/service/view-all"
          className="text-blue-600 flex items-center hover:text-amber-700 transition-colors"
        >
          <span className="mr-1">View All</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      
      {services.length === 0 ? (
        // Empty state
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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
              <ServiceListItem 
                service={enhanceService(service)} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopPicks;
