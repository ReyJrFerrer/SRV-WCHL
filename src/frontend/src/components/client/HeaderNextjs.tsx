import React, { useState, useRef, useEffect } from 'react';
import { MapPinIcon, CheckCircleIcon, BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from "@bundly/ares-react";
import SearchBar from './SearchBarNextjs';
import BottomSheet from './BottomSheetNextjs';
import ServiceLocationMap from './ServiceLocationMapNextjs';
// Import the hook and service
import { useAllServicesWithProviders } from '../../hooks/serviceInformation';
import authCanisterService, { FrontendProfile } from '../../services/authCanisterService';
import { useLogout } from '../../hooks/logout';

interface HeaderProps {
  className?: string;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({ 
  className = '',
  notificationCount = 0 
}) => {
  const router = useRouter();
  const { isAuthenticated, currentIdentity } = useAuth();
  const { logout, isLoggingOut } = useLogout(); // Use the hook
  const [profile, setProfile] = useState<FrontendProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  // Use the hook to fetch all services
  const { services, loading, error } = useAllServicesWithProviders();

  
  // Fetch user profile when authenticated
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !currentIdentity) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);
      try {
        const userProfile = await authCanisterService.getMyProfile();
        setProfile(userProfile);
      } catch (error) {
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, currentIdentity]);

  const handleLocationClick = () => {
    //  setLocationSheetOpen(true);
    return null;
  };

  const handleAddressMapClick = () => {
    //  setLocationSheetOpen(false);
    //  router.push('/client/service-maps');
    return null;
  };

  const handleProfileClick = () => {
    return null;
  };

  const handleNotificationClick = () => {
    return null;
  };

  const handleLogout = () => {
    logout(); // Use the logout function from the hook
  };

  // Extract first name from profile
  const displayName = profile?.name ? profile.name.split(' ')[0] : 'Guest';
  const isVerified = profile?.isVerified || false;

  return (
     <header className={`bg-white rounded-lg shadow-sm p-4 space-y-4 ${className}`}>
      {/* Top Row: Logo + Home | Logout*/}
      <div className="flex justify-between items-center">
        <Link href="/client/home" legacyBehavior>
          <a aria-label="Home" className="flex items-center">
            <Image 
              src="/logo.svg"
              alt="SRV Logo"
              width={100}
              height={40}
              className="object-contain"
            />
          </a>
        </Link>
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

      {/* Location Section */}
      <div className="bg-yellow-200 p-4 rounded-lg">
        <p className="text-sm font-medium text-gray-800">Aking Lokasyon</p>
        <div className="flex items-center">
          <MapPinIcon className="h-5 w-5 text-gray-700 mr-2" />
          <span className="text-gray-800">
           Olongapo City
          </span>
        </div>

        {/* Search Bar with padding above */}
        <div className="w-full mt-4">
          <SearchBar 
            placeholder="Maghanap ng Serbisyo"
            redirectToSearchResultsPage={true}
            servicesList={services}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
