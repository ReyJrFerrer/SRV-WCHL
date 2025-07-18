import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'; 
import { useAuth } from "@bundly/ares-react";

// Components
import ServiceListItem from '@app/components/client/ServiceListItemNextjs';
import BottomNavigation from '@app/components/client/BottomNavigationNextjs';
import SearchBar from '@app/components/client/SearchBarNextjs';

// Hooks
import { useAllServicesWithProviders, EnrichedService } from '@app/hooks/serviceInformation';


const SearchResultsPage: React.FC = () => {
  const router = useRouter();
  const { q: queryParam } = router.query;
  const { isAuthenticated, currentIdentity } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<EnrichedService[]>([]);
  
  // Use the centralized hook to get all services with provider data
  const { services: allServices, loading, error } = useAllServicesWithProviders();

  // Perform search when query changes or when all services are loaded
  const performSearch = useCallback((currentQuery: string) => {
    if (!currentQuery.trim() || allServices.length === 0) {
      setResults([]);
      return;
    }

    const lowerCaseQuery = currentQuery.toLowerCase();
    
    const filteredResults = allServices.filter(service =>
      service.name.toLowerCase().includes(lowerCaseQuery) ||
      (service.title && service.title.toLowerCase().includes(lowerCaseQuery)) ||
      (service.category && service.category.name.toLowerCase().includes(lowerCaseQuery)) ||
      (service.description && service.description.toLowerCase().includes(lowerCaseQuery)) ||
      (service.providerName && service.providerName.toLowerCase().includes(lowerCaseQuery))
    );
    
    setResults(filteredResults);
  }, [allServices]);

  // Update search query when URL parameter changes
  useEffect(() => {
    let currentQ = '';
    if (Array.isArray(queryParam)) {
      currentQ = queryParam[0] || '';
    } else if (typeof queryParam === 'string') {
      currentQ = queryParam;
    }

    setSearchQuery(currentQ);

    if (currentQ) {
      performSearch(currentQ);
    } else {
      setResults([]);
    }
  }, [queryParam, performSearch]);

  // Handle search on page
  const handleSearchOnPage = (newQuery: string) => {
    const trimmedNewQuery = newQuery.trim();
    if (trimmedNewQuery !== searchQuery.trim()) {
      router.replace(`/client/search-results?q=${encodeURIComponent(trimmedNewQuery)}`, undefined, { shallow: true });
    }
  };

  return (
    <>
      <Head>
        <title>SRV | {searchQuery ? `Search: ${searchQuery}` : 'Search Results'}</title>
        <meta name="description" content={`Search results for services ${searchQuery ? `related to ${searchQuery}` : ''}`} />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate flex-grow">
              {searchQuery ? `Results for "${searchQuery}"` : 'Search Services'}
            </h1>
          </div>
          <SearchBar
            placeholder="Search for another service..."
            onSearch={handleSearchOnPage} 
            initialQuery={searchQuery}    
            redirectToSearchResultsPage={false} 
            servicesList={allServices}
          />
        </header>

        {/* Results List */}
        <main className="flex-grow p-2 sm:p-4 overflow-y-auto pb-20">
          {loading && (
            <div className="text-center py-10 text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
              Searching...
            </div>
          )}
          {error && (
            <div className="text-center py-16">
              <p className="text-lg text-red-500">Error loading services. Please try again.</p>
            </div>
          )}
          {!loading && !error && searchQuery && results.length === 0 && (
            <div className="text-center py-16">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-500">
                {searchQuery ? `No services found matching "${searchQuery}".` : "Enter a term above to search for services."}
              </p>
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-2">Try a different search term or check your spelling.</p>
              )}
            </div>
          )}
          {!loading && !error && !searchQuery && (
            <div className="text-center py-16">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-500">Enter a term above to search for services.</p>
            </div>
          )}
          {!loading && !error && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {results.map((service) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
                  isGridItem={true}
                  retainMobileLayout={true}
                />
              ))}
            </div>
          )}
        </main>
        
        <div className="lg:hidden">
            <BottomNavigation />
        </div>
      </div>
    </>
  );
};

export default SearchResultsPage;
