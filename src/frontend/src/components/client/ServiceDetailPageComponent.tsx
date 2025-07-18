import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { enrichServiceWithProvider } from '@app/utils/serviceHelpers';
import { FrontendProfile } from '@app/services/authCanisterService';
import { Service } from '@app/services/serviceCanisterService';
import { FormattedServiceDetail } from '@app/hooks/serviceDetail';
import { useServiceReviews } from '@app/hooks/reviewManagement';

interface ServiceDetailPageComponentProps {
  service: FormattedServiceDetail | null; 
  provider?: FrontendProfile | null;
}

// Service Hero Image Component
const ServiceHeroImage: React.FC<{ service: any, provider?: FrontendProfile | null }> = ({ service, provider }) => (
  <div className="w-full h-48 md:h-64 lg:h-96 overflow-hidden relative">
    <Image 
      src={'/images/Technician1.jpg'} 
      alt={service.title || service.name} 
      width={1200} 
      height={400} 
      className="w-full h-full object-cover"
      priority
    />
    {/* Gradient overlay for better text readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:from-black/20"></div>
    
    {/* Hero content overlay for desktop */}
    <div className="hidden lg:block absolute bottom-6 left-8 text-white">
      <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
      <div className="flex items-center">
        <p className="text-lg opacity-90 mr-4">{service.category.name}</p>
        <div className="flex items-center text-white/90 bg-black/30 px-3 py-1 rounded-full">
          <span className="text-sm">By {provider?.name || service.providerName || 'Service Provider'}</span>
        </div>
      </div>
    </div>
  </div>
);

// Service Info Section Component
const ServiceInfoSection: React.FC<{ service: any, provider?: FrontendProfile | null }> = ({ service, provider }) => (
  <div className="card mb-6">
    {/* Title only shown on mobile/tablet, hidden on desktop due to hero overlay */}
    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 lg:hidden">{service.title || service.name}</h2>
    
    {/* Provider name for mobile display */}
    <div className="flex items-center mb-3 lg:hidden">
      <div className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
        By {provider?.name || service.providerName || 'Service Provider'}
      </div>
      <div className="text-sm text-gray-600 ml-2 bg-blue-50 px-3 py-1 rounded-full">
        {service.category.name}
      </div>
    </div>
    
    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">{service.description}</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-start">
        <span className="text-xl mr-3 mt-0.5">📍</span>
        <div>
          <span className="font-medium text-gray-800 block">Lokasyon</span>
          <span className="text-sm text-gray-600 block">
            {service.location.address}
          </span>
          <span className="text-xs text-gray-500 block mt-1">
            Saklaw ng serbisyo: {service.location.serviceRadius}{service.location.serviceRadiusUnit}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Service Availability Section Component
const ServiceAvailabilitySection: React.FC<{ service: any }> = ({ service }) => (
  <div className="card mb-6">
    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
      <span className="text-xl mr-2">📅</span>
      Availabilidad
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <span className="font-medium text-gray-800 block mb-2">Iskedyul</span>
        <div className="flex flex-wrap gap-1">
          {service.availability.schedule.map((day: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {day}
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <span className="font-medium text-gray-800 block mb-2">Mga Oras</span>
        <div className="flex flex-wrap gap-1">
          {service.availability.timeSlots.map((slot: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {slot}
            </span>
          ))}
        </div>
      </div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className={`flex items-center text-sm font-medium ${service.availability.isAvailableNow ? 'text-green-600' : 'text-red-600'}`}>
        <span className="text-lg mr-2">
          {service.availability.isAvailableNow ? '✅' : '⏰'}
        </span>
        {service.availability.isAvailableNow ? "Available Now" : "Currently Busy"}
      </div>
    </div>
  </div>
);

// Service Rating Section Component
const ServiceRatingSection: React.FC<{ service: any }> = ({ service }) => {
  const router = useRouter();
  
  // Use the review management hook to get real rating data
  const {
    reviews,
    loading: reviewsLoading,
    error: reviewsError,
    getAverageRating,
    getRatingDistribution,
    calculateServiceRating
  } = useServiceReviews(service?.id);

  // Local state for calculated rating data
  const [serviceRating, setServiceRating] = useState<{
    average: number;
    count: number;
    distribution: Record<number, number>;
  }>({
    average: service?.rating?.average || 0,
    count: service?.rating?.count || 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Calculate real rating when reviews are loaded
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const visibleReviews = reviews.filter(review => review.status === 'Visible');
      const average = getAverageRating(visibleReviews);
      const count = visibleReviews.length;
      const distribution = getRatingDistribution(visibleReviews);
      
      setServiceRating({
        average,
        count,
        distribution
      });
    } else if (!reviewsLoading && reviews) {
      // No reviews found - set to zero
      setServiceRating({
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  }, [reviews, reviewsLoading, getAverageRating, getRatingDistribution]);

  const handleViewReviews = () => {
    // Navigate to reviews page with service ID
    router.push(`/client/service/reviews/${service.id}`);
  };

  // Show loading state
  if (reviewsLoading) {
    return (
      <div className="card mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-xl mr-2">⭐</span>
          Rating & Reviews
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-8 bg-gray-200 animate-pulse rounded mr-2"></div>
            <div>
              <div className="flex mb-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-gray-300 animate-pulse">★</span>
                ))}
              </div>
              <div className="w-20 h-4 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
          <div className="w-24 h-8 bg-gray-200 animate-pulse rounded"></div>
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
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="text-xl mr-2">⭐</span>
          Rating & Reviews
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl font-bold text-yellow-500 mr-2">
              {fallbackRating.average.toFixed(1)}
            </span>
            <div>
              <div className="flex text-yellow-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(fallbackRating.average) ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600">{fallbackRating.count} reviews</p>
              <p className="text-xs text-red-500">Hindi ma-load ang pinakabagong mga review</p>
            </div>
          </div>
          <button 
            onClick={handleViewReviews}
            className="btn-secondary text-sm px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors"
          >
            View Reviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <span className="text-xl mr-2">⭐</span>
        Rating & Mga Review
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-3xl font-bold text-yellow-500 mr-2">
            {serviceRating.average > 0 ? serviceRating.average.toFixed(1) : '0.0'}
          </span>
          <div>
            <div className="flex text-yellow-400 mb-1">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className={i < Math.floor(serviceRating.average) ? 'text-yellow-400' : 'text-gray-300'}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {serviceRating.count} {serviceRating.count === 1 ? 'review' : 'reviews'}
            </p>
            {/* ✅ Add real-time indicator */}
            {serviceRating.count > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Live data from {serviceRating.count} verified reviews
              </p>
            )}
            {serviceRating.count === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No reviews yet - be the first to review!
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <button 
            onClick={handleViewReviews}
            className="btn-secondary text-sm px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors mb-2"
          >
            {serviceRating.count > 0 ? 'View Reviews' : 'See Details'}
          </button>
          
          {/* ✅ Show rating distribution preview */}
          {serviceRating.count > 0 && (
            <div className="text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>5★</span>
                <div className="w-8 h-1 bg-gray-200 rounded">
                  <div 
                    className="h-1 bg-yellow-400 rounded"
                    style={{ 
                      width: `${serviceRating.count > 0 ? (serviceRating.distribution[5] / serviceRating.count) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span>{serviceRating.distribution[5]}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>4★</span>
                <div className="w-8 h-1 bg-gray-200 rounded">
                  <div 
                    className="h-1 bg-yellow-400 rounded"
                    style={{ 
                      width: `${serviceRating.count > 0 ? (serviceRating.distribution[4] / serviceRating.count) * 100 : 0}%` 
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
const ServiceVerificationSection: React.FC<{ isVerified: boolean }> = ({ isVerified }) => (
  <div className="card mb-6 lg:mb-0 lg:p-0 lg:bg-transparent lg:shadow-none lg:border-0">
    <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center lg:hidden">
      <span className="text-xl mr-2">🛡️</span>
      Verification Status
    </h3>
    <div className={`flex items-center justify-between p-3 rounded-lg ${isVerified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'} lg:p-2`}>
      <div className="flex items-center">
        <span className={`text-lg mr-3 lg:mr-2 ${isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
          {isVerified ? '✅' : '⚠️'}
        </span>
        <div>
          <span className={`font-medium ${isVerified ? 'text-green-700' : 'text-yellow-700'}`}>
            {isVerified ? 'Veripikado' : 'Hinihintay ang verepikasyon'}
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">
            {isVerified ? 'Verified lahat ng dokumento ' : 'Isinasagawa pa ang pagsusuri ng dokumento'}
          </span>
        </div>
      </div>
      {isVerified && (
        <span className="text-green-600 text-xl lg:text-sm">🏆</span>
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
  id: 'placeholder-service',
  providerId: 'placeholder-provider',
  name: 'Service Provider',
  title: 'Professional Service',
  description: 'This service provider offers professional services. Detailed information will be available once connected to the backend.',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  price: {
    amount: 1000,
    currency: 'PHP',
    unit: '/ Hour',
    isNegotiable: true
  },
  location: {
    address: 'Baguio City, Philippines',
    coordinates: {
      latitude: 16.4095,
      longitude: 120.5975
    },
    serviceRadius: 10,
    serviceRadiusUnit: 'km'
  },
  availability: {
    schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['09:00-17:00'],
    isAvailableNow: true
  },
  rating: {
    average: 4.5,
    count: 15
  },
  media: [],
  requirements: [
    'Please provide service details during booking',
    'Ensure availability at scheduled time',
    'Payment terms will be discussed'
  ],
  isVerified: false,
  slug: 'placeholder-service',
  heroImage: '/images/default-service.png',
  providerName: 'Service Provider', // Added provider name
  providerAvatar: null, // Added provider avatar
  priceDisplay: '$1000.00', // Added price display
  category: {
    id: 'cat-placeholder',
    name: 'General Services',
    description: 'General professional services',
    slug: 'general-services',
    icon: 'service',
    imageUrl: '/images/default-category.png',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
});

// Main Service Detail Component
const ServiceDetailPageComponent: React.FC<ServiceDetailPageComponentProps> = ({ service, provider }) => {
  const router = useRouter();

  // Use placeholder service if no service is provided
  const placeholderService = createPlaceholderService();
  
  // Use the service directly if provided, otherwise use placeholder
  const displayService = service || placeholderService;

  const handleBookingRequest = () => {
    // Navigate to booking page with the service slug (works for both real and placeholder data)
    router.push(`/client/book/${displayService.id}`);
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
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Ibook itong Serbisyo</h3>
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-2">Tagapagbigay</p>
                  <div className="flex items-center">
                    {provider?.profilePicture?.imageUrl || displayService.providerAvatar ? (
                      <Image
                        src={provider?.profilePicture?.imageUrl || displayService.providerAvatar || '/images/default-avatar.png'}
                        alt={provider?.name || displayService.providerName || 'Service Provider'}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xl">👤</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-800 block">
                        {provider?.name || displayService.providerName || 'Service Provider'}
                      </span>
                      <span className="text-xs text-gray-500">Miyembro simula pa noong {new Date(displayService.createdAt).getFullYear()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <button
                    onClick={handleBookingRequest}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Ibook na
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    "Hindi ka pa sisingilin."
                  </p>
                </div>
                
                <ServiceVerificationSection isVerified={displayService.isVerified} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile booking button - Only visible on mobile */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Price:</span>
          <span className="font-semibold text-gray-800">
            {displayService.price.currency === 'PHP' ? '₱' : displayService.price.currency}
            {displayService.price.amount.toFixed(2)} {displayService.price.unit}
          </span>
        </div>
        <button
          onClick={handleBookingRequest}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          Ibook Na
        </button>
      </div>
    </div>
  );
};

export default ServiceDetailPageComponent;
