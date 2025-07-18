// SRV-ICP-ver2-jdMain/frontend/src/components/provider/ProviderServiceListItem.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Service } from '../../../assets/types/service/service';
import { PencilIcon, EyeIcon, EyeSlashIcon, ChartBarIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProviderServiceListItemProps {
  service: Service;
  onToggleActive: (serviceId: string, currentStatus: boolean) => void;
  onDeleteService: (serviceId: string) => void;
}

const ProviderServiceListItem: React.FC<ProviderServiceListItemProps> = ({ service, onToggleActive, onDeleteService }) => {
  const servicePrice = service.price || (service.packages && service.packages.length > 0 ? service.packages[0].price : 0);
  // Ensure servicePrice is an object with 'amount' or a number before calling toFixed
  const priceAmount = typeof servicePrice === 'number' ? servicePrice : (servicePrice as any)?.amount || 0;
  const priceUnit = service.price?.unit || (service.packages && service.packages.length > 0 ? (service.packages[0].duration || '/pkg') : '/service');
  const currencySymbol = service.price?.currency === 'PHP' ? '₱' : (service.price?.currency || '₱');
  const heroImageUrl = typeof service.heroImage === 'string' ? service.heroImage : (service.heroImage as any)?.src;


  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition-shadow duration-300">
      <div className="md:w-1/3 relative h-48 md:h-auto">
        {heroImageUrl && (
            <Image
            src={heroImageUrl}
            alt={service.title || service.name}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            />
        )}
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold text-white rounded-full
                      ${service.isActive ? 'bg-green-500' : 'bg-gray-500'}`}
        >
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{service.category.name}</p>
          {/* MODIFICATION: Make title a link */}
          <Link href={`/provider/service-details/${service.id}`} legacyBehavior>
            <a className="hover:text-blue-600 transition-colors" title="View service details">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 truncate">
                {service.title || service.name}
              </h3>
            </a>
          </Link>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={service.description}>
            {service.description}
          </p>
          <div className="flex items-center text-sm text-gray-700 mb-3">
            <span className="font-semibold text-lg text-green-600">
              {currencySymbol}{priceAmount.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 ml-1">{priceUnit}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 items-center justify-start">
          <Link href={`/provider/services/edit/${service.id}`} legacyBehavior>
            <a className="flex items-center text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition-colors">
              <PencilIcon className="h-4 w-4 mr-1.5" /> Edit
            </a>
          </Link>
          <button
            onClick={() => onToggleActive(service.id, service.isActive)}
            className={`flex items-center text-xs sm:text-sm font-medium py-2 px-3 rounded-lg transition-colors
                        ${service.isActive
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            {service.isActive ? <EyeSlashIcon className="h-4 w-4 mr-1.5" /> : <EyeIcon className="h-4 w-4 mr-1.5" />}
            {service.isActive ? 'Set Inactive' : 'Set Active'}
          </button>
          {/* Stats link can also go to the new detail page or a dedicated stats page */}
          <Link href={`/provider/service-details/${service.id}?section=stats`} legacyBehavior>
            <a className="flex items-center text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors">
              <ChartBarIcon className="h-4 w-4 mr-1.5" /> Stats
            </a>
          </Link>
           <button
            onClick={() => onDeleteService(service.id)}
            className="flex items-center text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-colors ml-auto md:ml-0"
          >
            <TrashIcon className="h-4 w-4 mr-1.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderServiceListItem;