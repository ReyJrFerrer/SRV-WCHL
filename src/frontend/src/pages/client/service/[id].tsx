import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from "@bundly/ares-react";

// Components
import ServiceDetailPageComponent from '../../../components/client/ServiceDetailPageComponent';
import BottomNavigation from '../../../components/client/BottomNavigationNextjs';

// Custom hooks
import { useServiceDetail } from '@app/hooks/serviceDetail';

const ServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const { id} = router.query;
  const { isAuthenticated, currentIdentity } = useAuth();
  
  // Use our custom hook to fetch service details
  const { service, provider, loading, error } = useServiceDetail(id as string);

  const handleBackClick = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {service ? `${service.name} - ${service.title}` : 'Service Details'} | SRV Client
        </title>
        <meta 
          name="description" 
          content={service?.description || 'Professional service details'} 
        />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Page Header */}
        <header className="flex items-center justify-between px-4 py-4 md:px-6 lg:px-8 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center flex-grow">
            <button 
              onClick={handleBackClick} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0 mr-4"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex-grow lg:flex lg:items-center lg:justify-between">
              {/* <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 truncate">
                {service?.title || 'Service Details'}
              </h1> */}
              {/* Desktop breadcrumb */}
              <div className="hidden lg:flex items-center text-sm text-gray-500 space-x-2">
                <span>Services</span>
                <span>/</span>
                <span className="text-gray-800 font-medium">{service?.category?.name || 'Category'}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto scrollbar-hide pb-20 lg:pb-0">
          {error && (
            <div className="mx-4 my-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <ServiceDetailPageComponent service={service} provider={provider} />
        </main>
        
        {/* Bottom Navigation - Hidden on large screens */}
        <div className="lg:hidden">
          <BottomNavigation />
        </div>
      </div>
    </>
  );
};

export default ServiceDetailPage;
