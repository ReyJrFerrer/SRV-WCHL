import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-gray-300">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-2 inline-block">
              <Image src="/logo.svg" alt="SRV Logo" width={100} height={50} />
            </Link>
            <p className="text-sm text-gray-400">
              Your trusted platform for booking services on the Internet
              Computer.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">For Users</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/client"
                  className="text-gray-400 transition-colors hover:text-yellow-300"
                >
                  Client Portal
                </Link>
              </li>
              <li>
                <Link
                  href="/provider"
                  className="text-gray-400 transition-colors hover:text-yellow-300"
                >
                  Provider Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">revitalizers2024@gmail.com</li>
              <li>
                <Link
                  href="https://www.facebook.com/revitalizer2024"
                  className="text-gray-400 transition-colors hover:text-yellow-300"
                >
                  Facebook: SRV
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-8 text-center text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} SRV Service Booking. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
