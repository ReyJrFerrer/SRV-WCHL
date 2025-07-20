import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

// Components
import SearchBar from "../../../components/client/SearchBar";
import ServiceListItem from "../../../components/client/ServiceListItem";
import BottomNavigation from "../../../components/client/BottomNavigation";

// Hooks
import {
  useServicesByCategory,
  useAllServicesWithProviders,
} from "../../../hooks/serviceInformation";

// Services
import serviceCanisterService from "../../../services/serviceCanisterService";

// Utilities
import { getCategoryIcon } from "../../../utils/serviceHelpers";

interface CategoryState {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
}

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [category, setCategory] = useState<CategoryState | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Determine which hook to use based on the category
  const categoryId = category?.id || "";
  const isAllServices = slug === "all-service-types";

  // Use appropriate hook based on category
  const allServicesHook = useAllServicesWithProviders();
  const categoryServicesHook = useServicesByCategory(categoryId);

  // Choose the appropriate data based on the route
  const {
    services,
    loading: servicesLoading,
    error: servicesError,
  } = isAllServices ? allServicesHook : categoryServicesHook;

  // Set document title
  useEffect(() => {
    if (category) {
      document.title = `${category.name} | SRV`;
    } else {
      document.title = "Category | SRV";
    }
  }, [category]);

  useEffect(() => {
    if (!slug) return;

    const loadCategory = async () => {
      try {
        const canisterCategories =
          await serviceCanisterService.getAllCategories();

        let foundCategory: CategoryState | null = null;

        if (canisterCategories && canisterCategories.length > 0) {
          // Look for the specific category by slug
          const matchedCategory = canisterCategories.find(
            (cat) => cat.slug === slug,
          );

          if (matchedCategory) {
            foundCategory = {
              id: matchedCategory.id,
              name: matchedCategory.name,
              description:
                matchedCategory.description ||
                `Services in ${matchedCategory.name} category`,
              slug: matchedCategory.slug,
              icon: getCategoryIcon(matchedCategory.name),
            };
            setCategory(foundCategory);
          } else if (slug === "all-service-types") {
            // Special case for all services
            foundCategory = {
              id: "all",
              name: "All Service Types",
              description: "Browse all available service types",
              slug: "all-service-types",
            };
            setCategory(foundCategory);
          } else {
            console.warn(`Category with slug "${slug}" not found`);
            setCategory(null);
          }
        } else {
          console.warn("No categories found in service canister");
          setCategory(null);
        }
      } catch (error) {
        console.error("Failed to load category data from canister:", error);
        setCategory(null);
      }
    };

    loadCategory();
  }, [slug]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (servicesLoading || !category) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-xl text-red-600">Category not found</p>
          <Link to="/client/home" className="text-blue-500 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white px-4 py-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="truncate text-xl font-bold">{category.name}</h1>
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
          <div className="mb-4 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
            <span className="block sm:inline">{servicesError.message}</span>
          </div>
        )}

        {filteredServices.length === 0 && !servicesError ? (
          <div className="py-10 text-center">
            <p className="text-gray-500">
              {searchTerm
                ? `No services found for "${searchTerm}" in this category.`
                : "No services found in this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
  );
};

export default CategoryPage;
