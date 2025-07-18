import { useState, useEffect } from "react";
// Import useAuth when needed
// import { useAuth } from "../../context/AuthContext";

// Components
import Header from "../../components/client/HeaderNextjs";
import Categories from "../../components/client/CategoriesNextjs";
import TopPicks from "../../components/client/TopPicksNextjs";
import BottomNavigation from "../../components/client/BottomNavigationNextjs";
// Utilities
import { getCategoryIcon } from "../../utils/serviceHelpers";

// Hooks
import { useCategories } from "../../hooks/serviceInformation";

// Define the adapted category type that matches the Categories component requirements
interface AdaptedCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

const ClientHomePage: React.FC = () => {
  // If you need auth later, you can uncomment this line
  // const { isAuthenticated, identity } = useAuth();
  const [adaptedCategories, setAdaptedCategories] = useState<AdaptedCategory[]>(
    [],
  );

  // Use the categories hook
  const { categories, loading, error } = useCategories();

  // Set document title using React 19 approach
  useEffect(() => {
    document.title = "SRV | Find Local Service Providers";
    // You could add a meta description here too if needed
    // const metaDescription = document.querySelector('meta[name="description"]');
    // if (metaDescription) {
    //   metaDescription.setAttribute('content', 'Find the best service providers near you');
    // }
  }, []);

  // Transform categories when they change
  useEffect(() => {
    if (categories && categories.length > 0) {
      const transformed: AdaptedCategory[] = categories.map((category) => ({
        id: category.id,
        name: category.name,
        icon: getCategoryIcon(category.name),
        slug: category.slug,
      }));
      setAdaptedCategories(transformed);
    } else {
      setAdaptedCategories([]);
    }
  }, [categories]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {error && (
        <div className="mx-4 mt-4 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
          <span className="block sm:inline">
            Failed to load categories: {error.message}
          </span>
        </div>
      )}

      <div className="px-4 pt-4 pb-16">
        <Header className="mb-6" />

        <Categories
          categories={adaptedCategories}
          className="mb-8"
          initialItemCount={3}
        />

        <TopPicks className="mb-8" />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ClientHomePage;
