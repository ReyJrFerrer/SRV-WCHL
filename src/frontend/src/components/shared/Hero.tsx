import React from "react";
import {
  FingerPrintIcon,
} from "@heroicons/react/24/solid";

interface HeroProps {
  onLoginClick: () => void;
  isLoginLoading: boolean;
}

export default function Hero({ onLoginClick, isLoginLoading }: HeroProps) {
  return (
    <section className="relative bg-white py-20 pt-36 text-slate-800">
      <div className="absolute top-6 left-6 z-20">
        <a href="/" className="block" aria-label="SRV Home">
          <img
            src="/logo.svg"
            alt="SRV Logo"
            className="h-16 w-auto"
          />
        </a>
      </div>

      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
            <img
              src="/heroImage.png"
              alt="Ang serbisyo rito ay always valued!"
              className="w-full h-auto object-contain"
            />
          </div>

          <p className="mx-auto max-w-4xl text-lg text-gray-600">
            Finding reliable help for everyday tasks can be a challenge. SRV is
            your user-friendly platform to easily discover, compare, and book a
            wide range of local on-demand service providers.
          </p>

          {/* Action Buttons */}
          <div className="mt-10">
            <button
              onClick={onLoginClick}
              disabled={isLoginLoading}
              className={`flex transform items-center justify-center rounded-lg bg-yellow-400 px-8 py-4 text-lg font-bold text-slate-800 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-yellow-500 hover:shadow-xl ${isLoginLoading ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {isLoginLoading ? (
                <>
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-slate-800"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <FingerPrintIcon className="mr-3 h-6 w-6" />
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
