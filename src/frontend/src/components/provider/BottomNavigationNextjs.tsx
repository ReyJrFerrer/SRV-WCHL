import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  WrenchScrewdriverIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/solid';

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigationNextjs: React.FC<BottomNavigationProps> = ({ className = '' }) => {
  const router = useRouter();
  
   const navItems = [
    { label: 'Dashboard', icon: <HomeIcon />, href: '/provider/home' },
    { label: 'Aking Bookings', icon: <CalendarDaysIcon />, href: '/provider/bookings' },
    { label: 'Aking Serbisyo', icon: <WrenchScrewdriverIcon />, href: '/provider/services' } // THIS IS THE LINK
  ];
  
  return (
    <nav className={`bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-stretch h-16 shadow-top-md z-50 ${className}`}>
      {navItems.map((item) => {
        // More robust active check, especially if /provider/home is /provider/
        const isActive = router.pathname === item.href || (router.pathname === '/provider' && item.href === '/provider/home');
        
        return (
          <Link key={item.href} href={item.href} legacyBehavior>
            <a className={`nav-item flex flex-col items-center justify-center flex-grow px-2 py-1 text-center transition-colors duration-150
                           ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-500'}`}>
              {React.cloneElement(item.icon, { 
                className: `h-5 w-5 sm:h-6 sm:w-6 mb-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}` 
              })}
              <span className="text-[10px] sm:text-xs leading-tight">{item.label}</span>
            </a>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavigationNextjs;