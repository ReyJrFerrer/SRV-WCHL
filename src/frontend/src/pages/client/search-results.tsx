import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import ServiceListItem from "../../components/client/ServiceListItem";
import BottomNavigation from "../../components/client/BottomNavigation";
import SearchBar from "../../components/client/SearchBar";

// Hooks
import {
  useAllServicesWithProviders,
  EnrichedService,
} from "../../hooks/serviceInformation";

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q");
  // const { isAuthenticated, currentIdentity } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [results, setResults] = useState<EnrichedService[]>([]);

  // Use the centralized hook to get all services with provider data
  const {
    services: allServices,
    loading,
    error,
  } = useAllServicesWithProviders();

  // Perform search when query changes or when all services are loaded
  const performSearch = useCallback(
    (currentQuery: string) => {
      if (!currentQuery.trim() || allServices.length === 0) {
        setResults([]);
        return;
      }

      const lowerCaseQuery = currentQuery.toLowerCase();

      const filteredResults = allServices.filter(
        (service) =>
          service.name.toLowerCase().includes(lowerCaseQuery) ||
          (service.title &&
            service.title.toLowerCase().includes(lowerCaseQuery)) ||
          (service.category &&
            service.category.name.toLowerCase().includes(lowerCaseQuery)) ||
          (service.description &&
            service.description.toLowerCase().includes(lowerCaseQuery)) ||
          (service.providerName &&
            service.providerName.toLowerCase().includes(lowerCaseQuery)),
      );

      setResults(filteredResults);
    },
    [allServices],
  );

  // Update search query when URL parameter changes
  useEffect(() => {
    const currentQ = queryParam || "";
    setSearchQuery(currentQ);

    if (currentQ) {
      performSearch(currentQ);
    } else {
      setResults([]);
    }
  }, [queryParam, performSearch]);

  // Update document title when search query changes
  useEffect(() => {
    document.title = searchQuery
      ? `SRV | Search: ${searchQuery}`
      : "SRV | Search Results";
  }, [searchQuery]);

  // Handle search on page
  const handleSearchOnPage = (newQuery: string) => {
    const trimmedNewQuery = newQuery.trim();
    if (trimmedNewQuery !== searchQuery.trim()) {
      setSearchParams({ q: trimmedNewQuery });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white px-4 py-3 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="flex-grow truncate text-lg font-semibold text-gray-800">
            {searchQuery ? `Results for "${searchQuery}"` : "Search Services"}
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
      <main className="flex-grow overflow-y-auto p-2 pb-20 sm:p-4">
        {loading && (
          <div className="py-10 text-center text-gray-600">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
            Searching...
          </div>
        )}
        {error && (
          <div className="py-16 text-center">
            <p className="text-lg text-red-500">
              Error loading services. Please try again.
            </p>
          </div>
        )}
        {!loading && !error && searchQuery && results.length === 0 && (
          <div className="py-16 text-center">
            <MagnifyingGlassIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg text-gray-500">
              {searchQuery
                ? `No services found matching "${searchQuery}".`
                : "Enter a term above to search for services."}
            </p>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-400">
                Try a different search term or check your spelling.
              </p>
            )}
          </div>
        )}
        {!loading && !error && !searchQuery && (
          <div className="py-16 text-center">
            <MagnifyingGlassIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg text-gray-500">
              Enter a term above to search for services.
            </p>
          </div>
        )}
        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
  );
};

export default SearchResultsPage;
