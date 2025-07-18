import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@bundly/ares-react";

// Components
import ServiceDetailPageComponent from "../../../components/client/ServiceDetailPageComponent";
import BottomNavigation from "../../../components/client/BottomNavigationNextjs";

// Custom hooks
import { useServiceDetail } from "@app/hooks/serviceDetail";

const ServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, currentIdentity } = useAuth();

  // Use our custom hook to fetch service details
  const { service, provider, loading, error } = useServiceDetail(id as string);

  const handleBackClick = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {service ? `${service.name} - ${service.title}` : "Service Details"} |
          SRV Client
        </title>
        <meta
          name="description"
          content={service?.description || "Professional service details"}
        />
      </Head>

      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Page Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-sm md:px-6 lg:px-8">
          <div className="flex flex-grow items-center">
            <button
              onClick={handleBackClick}
              className="mr-4 flex-shrink-0 rounded-full p-2 transition-colors duration-200 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex-grow lg:flex lg:items-center lg:justify-between">
              {/* <h1 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 truncate">
                {service?.title || 'Service Details'}
              </h1> */}
              {/* Desktop breadcrumb */}
              <div className="hidden items-center space-x-2 text-sm text-gray-500 lg:flex">
                <span>Services</span>
                <span>/</span>
                <span className="font-medium text-gray-800">
                  {service?.category?.name || "Category"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="scrollbar-hide flex-grow overflow-y-auto pb-20 lg:pb-0">
          {error && (
            <div className="mx-4 my-4 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
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
