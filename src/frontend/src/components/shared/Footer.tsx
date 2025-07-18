import React from "react";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-gray-300">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-1">
            <a href="/" className="mb-2 inline-block">
              <img src="/logo.jpeg" alt="SRV Logo" className="h-12 w-auto" />
            </a>
            <p className="text-sm text-gray-400">
              Your trusted platform for booking services on the Internet
              Computer.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">For Users</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/client"
                  className="text-gray-400 transition-colors hover:text-yellow-300"
                >
                  Client Portal
                </a>
              </li>
              <li>
                <a
                  href="/provider"
                  className="text-gray-400 transition-colors hover:text-yellow-300"
                >
                  Provider Portal
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">revitalizers2024@gmail.com</li>
              <li>
                <a
                  href="https://www.facebook.com/revitalizer2024"
                  className="text-gray-400 transition-colors hover:text-yellow-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook: SRV
                </a>
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
