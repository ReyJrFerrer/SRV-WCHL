import React, { useState, useEffect } from 'react';
import { useAuth } from "@bundly/ares-react";
import Head from 'next/head';
import Image from 'next/image';

// Components
import Header from '../../components/client/HeaderNextjs';
import Categories from '../../components/client/CategoriesNextjs';
import TopPicks from '../../components/client/TopPicksNextjs';
import BottomNavigation from '../../components/client/BottomNavigationNextjs';
// Utilities
import { getCategoryIcon } from '../../utils/serviceHelpers';

// Hooks
import { useCategories } from '../../hooks/serviceInformation';

// Define the adapted category type that matches the Categories component requirements
interface AdaptedCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

const ClientHomePage: React.FC = () => {
  const { isAuthenticated, currentIdentity } = useAuth();
  const [adaptedCategories, setAdaptedCategories] = useState<AdaptedCategory[]>([]);
  
  // Use the categories hook
  const { categories, loading, error } = useCategories();

  // Transform categories when they change
  useEffect(() => {
    if (categories && categories.length > 0) {
      const transformed: AdaptedCategory[] = categories.map(category => ({
        id: category.id,
        name: category.name,
        icon: getCategoryIcon(category.name),
        slug: category.slug
      }));
      setAdaptedCategories(transformed);
    } else {
      setAdaptedCategories([]);
    }
  }, [categories]);

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
        <title>SRV | Find Local Service Providers</title>
        <meta name="description" content="Find the best service providers near you" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mx-4 mt-4">
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

          <TopPicks 
            className="mb-8" 
          />
        </div>

        <BottomNavigation />
      </div>
    </>
  );
};

export default ClientHomePage;
