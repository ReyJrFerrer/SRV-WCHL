import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HomeIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, ChatBubbleLeftRightIcon as ChatIconSolid, ClipboardDocumentListIcon as BookingIconSolid } from '@heroicons/react/24/solid';

const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  
  const isActive = (path: string) => {
    return currentPath.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-40">
      <div className="flex justify-around items-center h-16">
        <Link href="/client/home" className="flex flex-col items-center justify-center w-full h-full">
          <div className={`flex flex-col items-center ${isActive('/client/home') ? 'text-blue-600' : 'text-gray-500'}`}>
            {isActive('/client/home') ? (
              <HomeIconSolid className="h-6 w-6" />
            ) : (
              <HomeIcon className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>

        <Link href="/client/booking" className="flex flex-col items-center justify-center w-full h-full">
          <div className={`flex flex-col items-center ${isActive('/client/booking') ? 'text-blue-600' : 'text-gray-500'}`}>
            {isActive('/client/booking') ? (
              <BookingIconSolid className="h-6 w-6" />
            ) : (
              <ClipboardDocumentListIcon className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Bookings</span>
          </div>
        </Link>
{/* 
        <Link href="/client/chat" className="flex flex-col items-center justify-center w-full h-full">
          <div className={`flex flex-col items-center ${isActive('/client/chat') ? 'text-green-600' : 'text-gray-500'}`}>
            {isActive('/client/chat') ? (
              <ChatIconSolid className="h-6 w-6" />
            ) : (
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            )}
            <span className="text-xs mt-1">Chat</span>
          </div>
        </Link> */}
        
 
      </div>
    </div>
  );
};

export default BottomNavigation;
