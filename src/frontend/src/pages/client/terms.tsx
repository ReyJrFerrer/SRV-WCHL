import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const TermsAndConditionsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-blue-100 bg-white p-10 shadow-2xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-blue-700 hover:text-blue-900 focus:outline-none"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.svg" alt="SRV Logo" className="mb-4 h-24 w-24" />
          <h1 className="text-center text-3xl font-extrabold tracking-tight text-blue-900">
            Terms and Conditions
          </h1>
        </div>
        <div className="space-y-6 text-lg text-gray-700">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
            <p>
              Welcome to <span className="font-bold text-blue-700">SRV</span>!
              By using this application, you agree to abide by our terms and
              conditions.
            </p>
            <ul className="mt-4 list-inside list-decimal pl-4 text-base text-gray-700">
              <li>Provide accurate and truthful information.</li>
              <li>Respect other users and service providers.</li>
              <li>Do not use SRV for any unlawful activities.</li>
              <li>SRV is not liable for any direct or indirect damages.</li>
              <li>Agree to our privacy policy and data handling practices.</li>
            </ul>
            <p className="mt-4 text-base text-gray-600 italic">
              Please read the full terms and conditions before proceeding. For
              more details, contact{" "}
              <a
                href="mailto:support@srv.com"
                className="text-blue-600 underline"
              >
                support
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
