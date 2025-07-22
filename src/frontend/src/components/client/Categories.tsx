import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useServiceManagement } from "../../hooks/serviceManagement"; // Adjust the import path as needed
import { ServiceCategory } from "../../services/serviceCanisterService"; // Adjust the import path as needed

interface CategoriesProps {
  className?: string;
  moreButtonImageUrl: string;
  lessButtonImageUrl?: string;
}

// Maps backend names to user-friendly Filipino display names
const getCategoryDisplayName = (name: string): string => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("electrician")) return "Electician";
  if (lowerName.includes("plumbing")) return "Plumber";
  if (lowerName.includes("beauty") || lowerName.includes("wellness"))
    return "Beauty at Wellness";
  if (lowerName.includes("clean")) return "Cleaning Service";
  if (lowerName.includes("auto")) return "Automotive Repair";
  if (lowerName.includes("gadget") || lowerName.includes("tech"))
    return "Gadget Repair";
  if (lowerName.includes("delivery")) return "Delivery Service";
  if (lowerName.includes("repair") || lowerName.includes("maintenance"))
    return "General Repair";
  if (lowerName.includes("photo")) return "Photography Services";
  if (lowerName.includes("tutor")) return "Tutoring";

  return name;
};

// This function maps a category name to a specific image URL.
const getImageUrlForCategory = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("home") || lowerName.includes("house"))
    return "/images/categories/home.png";
  if (lowerName.includes("clean")) return "/images/categories/cleaning.png";
  if (lowerName.includes("auto") || lowerName.includes("car"))
    return "/images/categories/auto.png";
  if (lowerName.includes("gadget") || lowerName.includes("tech"))
    return "/images/categories/gadget repair.png";
  if (lowerName.includes("beauty") || lowerName.includes("wellness"))
    return "/images/categories/wellnes.png";
  if (lowerName.includes("delivery")) return "/images/categories/delivery.png";
  if (lowerName.includes("electrician"))
    return "/images/categories/electrician.png";
  if (lowerName.includes("plumbing")) return "/images/categories/plumber.png";
  if (lowerName.includes("repair") || lowerName.includes("maintenance"))
    return "/images/categories/plumber.png";
  if (lowerName.includes("photo")) return "/images/categories/photography.png";
  if (lowerName.includes("tutor")) return "/images/categories/tutor.png";

  // Fallback image if no match is found
  return "/images/default-category.png";
};

const Categories: React.FC<CategoriesProps> = ({
  className = "",
  moreButtonImageUrl,
  lessButtonImageUrl,
}) => {
  const navigate = useNavigate();
  const { categories, loadingCategories, error } = useServiceManagement();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const initialMobileCount = 3;
  const initialCategoriesOnMobile = categories.slice(0, initialMobileCount);
  const shouldShowMoreButton = categories.length > initialMobileCount;

  const handleCategoryClick = (slug: string) => {
    navigate(`/client/categories/${slug}`);
  };

  const itemBaseClass =
    "flex-shrink-0 flex flex-col items-center text-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28";
  const imageSize = 60;
  const textClass =
    "text-sm md:text-base font-medium text-gray-700 h-12 flex items-center text-center";

  if (loadingCategories) {
    return (
      <div className={`p-4 ${className}`}>
        <h2 className="mb-4 h-7 w-1/3 animate-pulse rounded-md bg-gray-200 text-xl font-bold"></h2>
        <div className="grid grid-cols-4 gap-2 md:hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="h-[60px] w-[60px] animate-pulse rounded-lg bg-gray-200"></div>
              <div className="h-4 w-16 animate-pulse rounded-md bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <h2 className="mb-4 text-xl font-bold">Mga Kategorya</h2>
        <p className="text-red-500">Error loading categories: {error}</p>
      </div>
    );
  }

  const categoriesToDisplay = mobileExpanded
    ? categories
    : initialCategoriesOnMobile;

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Mga Kategorya</h2>
      </div>

      {/* Mobile Layout */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        {categoriesToDisplay.map((category: ServiceCategory) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={itemBaseClass}
          >
            <img
              src={getImageUrlForCategory(category.name)}
              alt={category.name}
              width={imageSize}
              height={imageSize}
              className="mb-2 object-cover"
            />
            <span className={textClass}>
              {getCategoryDisplayName(category.name)}
            </span>
          </button>
        ))}
        {shouldShowMoreButton && (
          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className={itemBaseClass}
          >
            <img
              src={
                mobileExpanded
                  ? lessButtonImageUrl || moreButtonImageUrl
                  : moreButtonImageUrl
              }
              alt={mobileExpanded ? "Less Categories" : "More Categories"}
              width={imageSize}
              height={imageSize}
              className={`mb-2 object-cover ${mobileExpanded ? "rotate-180 transform" : ""}`}
            />
            <span className={textClass}>
              {mobileExpanded ? "Bawasan" : "Iba pa"}
            </span>
          </button>
        )}
      </div>

      {/* Desktop Layout: Centered, horizontally scrollable row */}
      <div className="hidden md:flex md:justify-center">
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {categories.map((category: ServiceCategory) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={itemBaseClass}
            >
              <img
                src={getImageUrlForCategory(category.name)}
                alt={category.name}
                width={imageSize}
                height={imageSize}
                className="mb-2 object-cover"
              />
              <span className={textClass}>
                {getCategoryDisplayName(category.name)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
