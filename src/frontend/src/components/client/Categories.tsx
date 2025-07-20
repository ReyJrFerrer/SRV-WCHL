import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  EllipsisHorizontalCircleIcon,
  TruckIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CameraIcon,
  AcademicCapIcon,
  ScissorsIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/solid";

const iconMap: { [key: string]: React.ElementType } = {
  home: HomeIcon,
  broom: PaintBrushIcon,
  car: WrenchScrewdriverIcon,
  truck: TruckIcon,
  computer: ComputerDesktopIcon,
  bolt: BoltIcon,
  wrench: WrenchScrewdriverIcon,
  sparkles: SparklesIcon,
  scissors: ScissorsIcon,
  camera: CameraIcon,
  acads: AcademicCapIcon,
  default: EllipsisHorizontalCircleIcon,
};

interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

interface CategoriesProps {
  categories: Category[];
  className?: string;
  initialItemCount?: number;
}

// Map to standardize category display names
const getCategoryDisplayName = (name: string): string => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes("home") || lowerName.includes("house"))
    return "Gawaing Bahay";
  if (lowerName.includes("clean")) return "Paglilinis";
  if (lowerName.includes("auto") || lowerName.includes("car"))
    return "Para sa Sasakyan";
  if (
    lowerName.includes("gadget") ||
    lowerName.includes("tech") ||
    lowerName.includes("computer")
  )
    return "Gadyet";
  if (lowerName.includes("beauty") && lowerName.includes("wellness"))
    return "Spa";
  if (lowerName.includes("beauty") && lowerName.includes("services"))
    return "Pagpapaganda";
  if (lowerName.includes("delivery")) return "Paghahatid";
  if (lowerName.includes("electric")) return "Elektrikal";
  if (lowerName.includes("repair") || lowerName.includes("maintenance"))
    return "Pag-aayos";
  if (lowerName.includes("photographer")) return "Potograpiya";
  if (lowerName.includes("tutoring")) return "Pagtuturo";

  return name; // Return original if no match
};

const Categories: React.FC<CategoriesProps> = ({
  categories,
  className = "",
  initialItemCount = 3,
}) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const categoriesToDisplay = showAll
    ? categories
    : categories.slice(0, initialItemCount);
  const shouldShowToggleButton = categories.length > initialItemCount;

  // Function to render the appropriate icon based on category
  const renderIcon = (iconKey: string, baseClass: string) => {
    const IconComponent = iconMap[iconKey] || iconMap.default;
    return <IconComponent className={baseClass} />;
  };

  const handleToggleShowAll = () => {
    setShowAll((prevShowAll) => !prevShowAll);
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/client/categories/${slug}`);
  };

  // Define responsive classes
  const itemBaseClass =
    "flex flex-col items-center text-center p-1 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const iconContainerBaseClass =
    "mb-1 sm:mb-2 p-2 rounded-full inline-flex justify-center items-center group-hover:bg-blue-200 transition-colors";
  const iconSizeClass = "h-6 w-6 sm:h-8 sm:h-8 md:h-10 md:h-10";
  const iconContainerSizeClass = "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"; // Mobile: 40px, sm: 48px, md: 64px
  const textClass = "text-xs sm:text-sm font-medium text-gray-700";

  return (
    <div className={`${className}`}>
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h2 className="text-lg font-bold sm:text-xl">Mga Kategorya</h2>
      </div>

      {/* Grid with responsive gaps */}
      <div className="grid grid-cols-4 gap-x-1 gap-y-2 sm:gap-x-2 sm:gap-y-3 md:gap-4">
        {categoriesToDisplay.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={itemBaseClass}
            aria-label={`Category: ${category.name}`}
          >
            <div
              className={`${iconContainerBaseClass} ${iconContainerSizeClass} bg-blue-50 text-blue-600`}
            >
              {renderIcon(category.icon, iconSizeClass)}
            </div>
            <span className={textClass}>
              {getCategoryDisplayName(category.name)}
            </span>
          </button>
        ))}

        {shouldShowToggleButton && (
          <button
            onClick={handleToggleShowAll}
            className={itemBaseClass}
            aria-expanded={showAll}
            aria-label={
              showAll ? "Show fewer categories" : "Show more categories"
            }
          >
            <div
              className={`${iconContainerBaseClass} ${iconContainerSizeClass} bg-gray-50 text-gray-500`}
            >
              {showAll ? (
                <ChevronUpIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
            <span className={textClass}>{showAll ? "Bawasan" : "Iba pa"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Categories;
