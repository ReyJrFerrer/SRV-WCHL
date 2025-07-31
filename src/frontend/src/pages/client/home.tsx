import React from "react";

// Components
import Header from "../../components/client/Header";
import Categories from "../../components/client/Categories";
import ServiceList from "../../components/client/ServiceListReact";
import BottomNavigation from "../../components/client/BottomNavigation";

// Hooks
import { useServiceManagement } from "../../hooks/serviceManagement";

const ClientHomePage: React.FC = () => {
  const { error } = useServiceManagement();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50 pb-20">
      {error && (
        <div className="mx-4 mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <span className="block sm:inline">
            Failed to load categories: {error}
          </span>
        </div>
      )}
      <div className="w-full max-w-full px-4 pt-4 pb-16">
        <Header className="mb-6 w-full max-w-full" />
        <h2 className="mb-2 text-left text-xl font-bold">Categories</h2>
        <Categories
          className="mb-8 w-full max-w-full"
          moreButtonImageUrl="/images/categories/more.svg"
          lessButtonImageUrl="/images/categories/more.svg"
        />
        <ServiceList className="w-full max-w-full" />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ClientHomePage;
