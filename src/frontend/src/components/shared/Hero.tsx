import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserIcon, WrenchScrewdriverIcon, FingerPrintIcon } from '@heroicons/react/24/solid';
import { useAuth } from "@bundly/ares-react"; 

interface HeroProps {
  onLoginClick: () => void;
  isLoginLoading: boolean;
}

export default function Hero({ onLoginClick, isLoginLoading }: HeroProps) {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative bg-white text-slate-800 py-20 pt-36"> 
      
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" legacyBehavior>
          <a className="block" aria-label="SRV Home">
            <Image
              src="/logo.svg" 
              alt="SRV Logo"
              width={90}  
              height={Math.round(90 * (760 / 1000))} 
              priority
            />
          </a>
        </Link>
      </div>



      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center">
        
          <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mb-8">
            <Image
              src="/heroImage.png"
              alt="Ang serbisyo rito ay always valued!"
              width={1000}
              height={500}
              layout="responsive"
              objectFit="contain"
              priority
            />
          </div>

          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Finding reliable help for everyday tasks can be a challenge. SRV is your user-friendly platform to easily discover, compare, and book a wide range of local on-demand service providers.
          </p>

          {/* Action Buttons REPLACED */}
          <div className="mt-10">
            <button
              onClick={onLoginClick}
              disabled={isLoginLoading}
              className={`flex items-center justify-center bg-yellow-400 text-slate-800 hover:bg-yellow-500 
                          font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg 
                          hover:shadow-xl transform hover:scale-105 text-lg
                          ${isLoginLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoginLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800 mr-3"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <FingerPrintIcon className="h-6 w-6 mr-3" />
                  <span>Login / Sign Up</span>
                </>
              )}
            </button>
          </div>
        
        </div>
      </div>
    </section>
  );
}