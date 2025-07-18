import React from 'react';
import { useAuth } from "@bundly/ares-react";
import Head from 'next/head';

// Components
import BottomNavigation from '@app/components/client/BottomNavigationNextjs';

const ClientChatPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Head>
        <title>Chat | Service Provider App</title>
        <meta name="description" content="Chat with your service providers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Status bar */}
      
        <div className="px-4 pt-4">
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <h1 className="text-xl font-bold mb-2">Messages</h1>
            <p className="text-gray-500">Connect with service providers</p>
          </div>

          {isAuthenticated ? (
            <div className="bg-white rounded-xl shadow p-6 mb-4">
              <div className="flex flex-col items-center justify-center py-10">
                <div className="rounded-full bg-gray-100 p-4 mb-4">
                  <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-gray-500 text-center mb-4">
                  Your conversation with service providers will appear here
                </p>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Find Service Providers
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-lg text-red-600 mb-4">Please log in to access your messages</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Log In
              </button>
            </div>
          )}
        </div>

        <BottomNavigation />
      </div>
    </>
  );
};

export default ClientChatPage;
