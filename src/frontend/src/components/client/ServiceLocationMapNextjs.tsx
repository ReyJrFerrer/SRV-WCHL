import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface ServiceLocationMapProps {
  onClick?: () => void;
  fullScreen?: boolean;
  className?: string;
}

const ServiceLocationMap: React.FC<ServiceLocationMapProps> = ({ 
  onClick, 
  fullScreen = false,
  className = ''
}) => {
  // This would be replaced with actual location fetching logic in production
  const locationData = {
    latitude: 16.4145,
    longitude: 120.5960,
    name: "San Vicente, Baguio, Cordillera Administrative Region"
  };

  // In a real implementation, we would use a mapping library like Mapbox, Google Maps, or Leaflet
  // For now, we'll just show a placeholder and simulate the map experience
  
  return (
    <div 
      className={`relative rounded-xl overflow-hidden bg-gray-100 ${fullScreen ? 'h-full w-full' : 'h-48 w-full'} ${className}`}
      onClick={!fullScreen ? onClick : undefined}
    >
      {/* Placeholder for the map - in production, this would be an actual map component */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
        <p className="text-gray-500 text-center px-4">
          <MapPinIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          {fullScreen ? "Map view is not available in this preview" : "Tap to view on map"}
        </p>
      </div>

      {/* User location indicator */}
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-md">
        <div className="flex items-center">
          <MapPinIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-medium">Current Location</span>
        </div>
      </div>

      {/* Expand map hint for non-fullscreen view */}
      {!fullScreen && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 px-3 py-1 rounded-full">
          <span className="text-xs text-white">Tap to expand</span>
        </div>
      )}
    </div>
  );
};

export default ServiceLocationMap;
