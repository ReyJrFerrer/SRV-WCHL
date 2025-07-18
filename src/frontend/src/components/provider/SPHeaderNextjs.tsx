import React, { useState } from 'react';
import { MapPinIcon, BellIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FrontendProfile } from '../../services/authCanisterService';
import { useAuth } from '@bundly/ares-react';
import { useLogout } from '../../hooks/logout';

interface SPHeaderProps {
  provider: FrontendProfile | null;
  notificationCount?: number;
  className?: string;
}

const SPHeaderNextjs: React.FC<SPHeaderProps> = ({
  provider,
  notificationCount = 0,
  className = ''
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { logout, isLoggingOut } = useLogout(); // Use the hook
  

  const handleLogout = () => {
    logout();
  };

  if (!provider) {
    return (
     <header className={`provider-header bg-yellow-280 ${className}`}>
        <div className="flex justify-center items-center py-4">
          <div className="animate-pulse">
             <div className="h-8 bg-yellow-200 rounded w-48"></div>
          </div>
        </div>
      </header>
    );
  }

  /***
   * To add address map api functionality
   */

  return (
      <header className={`provider-header bg-white p-4 ${className} space-y-4`}>
      {/* Top Row: Welcome Info & Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={60}
            height={60}
            className="rounded-full bg-white flex-shrink-0"
            priority
          />
         
        </div>
      

        <div className="flex items-center space-x-4">
            <button className="location-badge flex items-center bg-yellow-200 px-4 py-2 rounded-full shadow-sm hover:bg-yellow-300 transition-colors">
              <span className="inline-flex items-center justify-center bg-blue-600 rounded-full p-1 mr-3">
                <MapPinIcon className="h-5 w-5 text-white" />
              </span>
              <span className="text-base font-medium text-black">
                Current Location: <span className="font-bold">Olongapo City</span>
              </span>

            </button>
            {notificationCount > 0 && (
              <button className="relative p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <BellIcon className="h-6 w-6 text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              </button>
            )}
            {isAuthenticated && (
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
               className="p-3 flex items-center justify-center bg-gray-100 rounded-full hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                ) : (
                  <ArrowRightOnRectangleIcon className="h-8 w-8" />
              )}
            </button>
          )}
        
        </div>
        </div>
         
  

      {/* Bottom Row: Expanded Location Bar */}
    
    </header>
  );
};

export default SPHeaderNextjs;
