import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigationNextjs: React.FC<BottomNavigationProps> = ({
  className = "",
}) => {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: <HomeIcon />, href: "/provider/home" },
    {
      label: "Aking Bookings",
      icon: <CalendarDaysIcon />,
      href: "/provider/bookings",
    },
    {
      label: "Aking Serbisyo",
      icon: <WrenchScrewdriverIcon />,
      href: "/provider/services",
    }, // THIS IS THE LINK
  ];

  return (
    <nav
      className={`bottom-nav shadow-top-md fixed right-0 bottom-0 left-0 z-50 flex h-16 items-stretch justify-around border-t border-gray-200 bg-white ${className}`}
    >
      {navItems.map((item) => {
        // More robust active check, especially if /provider/home is /provider/
        const isActive =
          location.pathname === item.href ||
          (location.pathname === "/provider" && item.href === "/provider/home");

        return (
          <Link
            key={item.href}
            to={item.href}
            className={`nav-item flex flex-grow flex-col items-center justify-center px-2 py-1 text-center transition-colors duration-150 ${isActive ? "font-semibold text-blue-600" : "text-gray-500 hover:text-blue-500"}`}
          >
            {React.cloneElement(item.icon, {
              className: `h-5 w-5 sm:h-6 sm:w-6 mb-0.5 ${isActive ? "text-blue-600" : "text-gray-500"}`,
            })}
            <span className="text-[10px] leading-tight sm:text-xs">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavigationNextjs;
