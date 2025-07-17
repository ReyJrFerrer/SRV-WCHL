import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UserIcon,
  WrenchScrewdriverIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "@bundly/ares-react";

interface HeroProps {
  onLoginClick: () => void;
  isLoginLoading: boolean;
}

export default function Hero({ onLoginClick, isLoginLoading }: HeroProps) {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative bg-white py-20 pt-36 text-slate-800">
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
          <div className="mb-8 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl">
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

          <p className="mx-auto max-w-4xl text-lg text-gray-600">
            Finding reliable help for everyday tasks can be a challenge. SRV is
            your user-friendly platform to easily discover, compare, and book a
            wide range of local on-demand service providers.
          </p>

          {/* Action Buttons REPLACED */}
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
