import React, { useState } from "react";

interface TermsAndConditionsModalProps {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  open,
  onClose,
  onAgree,
}) => {
  const [checked, setChecked] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-8 shadow-xl">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Terms and Conditions
        </h2>
        <div className="mb-6 max-h-64 overflow-y-auto text-sm text-gray-700">
          <p>
            Welcome to SRV! By creating a profile, you agree to abide by our
            terms and conditions. <br />
            <br />
            1. You will provide accurate and truthful information.
            <br />
            2. You will respect other users and service providers.
            <br />
            3. You will not use SRV for any unlawful activities.
            <br />
            4. SRV is not liable for any direct or indirect damages.
            <br />
            5. You agree to our privacy policy and data handling practices.
            <br />
            <br />
            Please read the full terms and conditions before proceeding.
          </p>
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="agree"
            checked={checked}
            onChange={() => setChecked(!checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="agree" className="text-sm text-gray-800">
            I agree with the terms and conditions
          </label>
        </div>
        <button
          className={`w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition-colors hover:bg-yellow-500 ${!checked ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={!checked}
          onClick={() => {
            if (checked) onAgree();
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;
