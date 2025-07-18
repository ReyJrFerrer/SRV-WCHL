import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useAuth } from "@bundly/ares-react";

// Components
import SearchBar from '@app/components/client/SearchBarNextjs';
import ServiceListItem from '@app/components/client/ServiceListItemNextjs';
import BottomNavigation from '@app/components/client/BottomNavigationNextjs';

// Hooks
import { useServicesByCategory, useAllServicesWithProviders, EnrichedService } from '@app/hooks/serviceInformation';

// Services
import serviceCanisterService from '@app/services/serviceCanisterService';

// Utilities
import { getCategoryIcon } from '@app/utils/serviceHelpers';

interface CategoryState {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
}

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { isAuthenticated, currentIdentity } = useAuth();
  
  const [category, setCategory] = useState<CategoryState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Determine which hook to use based on the category
  const categoryId = category?.id || '';
  const isAllServices = slug === 'all-service-types';
  
  // Use appropriate hook based on category
  const allServicesHook = useAllServicesWithProviders();
  const categoryServicesHook = useServicesByCategory(categoryId);
  
  // Choose the appropriate data based on the route
  const { services, loading: servicesLoading, error: servicesError, refetch } = isAllServices 
    ? allServicesHook 
    : categoryServicesHook;

  useEffect(() => {
    if (!slug) return;

    const loadCategory = async () => {
      try {
        const canisterCategories = await serviceCanisterService.getAllCategories();
        
        let foundCategory: CategoryState | null = null;
        
        if (canisterCategories && canisterCategories.length > 0) {
          // Look for the specific category by slug
          const matchedCategory = canisterCategories.find(cat => cat.slug === slug);
          
          if (matchedCategory) {
            foundCategory = {
              id: matchedCategory.id,
              name: matchedCategory.name,
              description: matchedCategory.description || `Services in ${matchedCategory.name} category`,
              slug: matchedCategory.slug,
              icon: getCategoryIcon(matchedCategory.name)
            };
            setCategory(foundCategory);
          } else if (slug === 'all-service-types') {
            // Special case for all services
            foundCategory = {
              id: 'all',
              name: 'All Service Types',
              description: 'Browse all available service types',
              slug: 'all-service-types'
            };
            setCategory(foundCategory);
          } else {
            console.warn(`Category with slug "${slug}" not found`);
            setCategory(null);
          }
        } else {
          console.warn('No categories found in service canister');
          setCategory(null);
        }
      } catch (error) {
        console.error('Failed to load category data from canister:', error);
        setCategory(null);
      }
    };

    loadCategory();
  }, [slug]);

  const handleBackClick = () => {
    router.back();
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (servicesLoading || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">Category not found</p>
          <Link href="/client/home" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{category.name} | Service Provider App</title>
        <meta name="description" content={category.description} />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={handleBackClick}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold truncate">{category.name}</h1>
          </div>
          
          <SearchBar 
            placeholder={`Search in ${category.name}`}
            className="mb-2"
            onSearch={handleSearch}
          />
        </div>

        {/* Services List */}
        <div className="p-2 sm:p-4">
          {servicesError && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <span className="block sm:inline">{servicesError.message}</span>
            </div>
          )}
          
          {filteredServices.length === 0 && !servicesError ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                {searchTerm ? `No services found for "${searchTerm}" in this category.` : "No services found in this category."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {filteredServices.map((service) => (
                <ServiceListItem 
                  key={service.id} 
                  service={service} 
                  isGridItem={true}
                  retainMobileLayout={true}
                />
              ))}
            </div>
          )}
        </div>

        <BottomNavigation />
      </div>
    </>
  );
};

export default CategoryPage;
