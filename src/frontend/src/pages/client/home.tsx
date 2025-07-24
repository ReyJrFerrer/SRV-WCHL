import React from "react";

// Components
import Header from "../../components/client/Header";
import Categories from "../../components/client/Categories";
import ServiceList from "../../components/client/ServiceListReact";
import BottomNavigation from "../../components/client/BottomNavigation";

// Hooks
import { useServiceManagement } from "../../hooks/serviceManagement";

const ClientHomePage: React.FC = () => {
  const { loadingCategories, error } = useServiceManagement();

  // Display a loading spinner while categories are being fetched by the hook.
  if (loadingCategories) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Display an error message if fetching categories failed */}
      {error && (
        <div className="mx-4 mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <span className="block sm:inline">
            Failed to load categories: {error}
          </span>
        </div>
      )}

      <div className="px-4 pt-4 pb-16">
        <Header className="mb-6" />
        <Categories
          className="mb-8"
          moreButtonImageUrl="/images/categories/more.png"
          lessButtonImageUrl="/images/categories/more.png"
        />
        <ServiceList />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ClientHomePage;
