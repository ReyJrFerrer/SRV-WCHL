// src/components/ProviderDashboard/PaymentPage.tsx

import React, { useState } from "react";

const PaymentProviderCommission: React.FC = () => {
  const [amountPaid, setAmountPaid] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  // Hardcoded GCash details for the provider to see
  const gcashDetails = {
    name: "Your Company Name",
    number: "0917-XXX-XXXX",
  };

  // Hardcoded outstanding balance for demonstration.
  // In a real app, this would be passed as a prop or fetched from an API.
  const outstandingBalance = 340.0;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setReceipt(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!amountPaid || !receipt) {
      alert("Please enter the amount and upload a receipt.");
      return;
    }

    // You would add your API call logic here to send the data to the backend.
    // Example using FormData for file uploads:
    const formData = new FormData();
    formData.append("providerId", "your-provider-id-here");
    formData.append("amountPaid", amountPaid);
    formData.append("receipt", receipt);

    // This is where you would send the formData to your backend's API endpoint.
    // fetch('/api/verify-commission-payment', {
    //   method: 'POST',
    //   body: formData,
    // })
    // .then(response => response.json())
    // .then(data => {
    //   alert("Payment proof submitted successfully!");
    //   // You might want to navigate back to the dashboard or show a confirmation screen.
    // })
    // .catch(error => {
    //   console.error('Error submitting payment:', error);
    //   alert("Failed to submit payment. Please try again.");
    // });

    console.log("Submitting payment proof:", { amountPaid, receipt });
    alert("Payment proof submitted! Awaiting admin verification.");

    // Reset form after submission
    setAmountPaid("");
    setReceipt(null);
  };

  return (
    <div className="container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-xl font-extrabold text-black sm:text-2xl md:text-3xl">
        Pay Commission
      </h1>

      <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Outstanding Balance:</h2>
        <p className="mb-6 text-4xl font-bold text-red-600">
          ₱{outstandingBalance.toFixed(2)}
        </p>

        <h2 className="mb-2 text-lg font-semibold">Company GCash Details:</h2>
        <p className="mb-4">
          <span className="font-medium">Name:</span> {gcashDetails.name} <br />
          <span className="font-medium">Number:</span> {gcashDetails.number}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Amount Paid
            </label>
            <input
              type="number"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., 340.00"
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Upload Receipt
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
            {receipt && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {receipt.name}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Submit Proof of Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentProviderCommission;
