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
  const outstandingBalance = 340.00;

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <h1 className="mb-6 text-xl font-extrabold text-black sm:text-2xl md:text-3xl">
        Pay Commission
      </h1>

      <div className="max-w-md mx-auto rounded-lg bg-white p-8 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Outstanding Balance:</h2>
        <p className="text-4xl font-bold text-red-600 mb-6">₱{outstandingBalance.toFixed(2)}</p>

        <h2 className="text-lg font-semibold mb-2">Company GCash Details:</h2>
        <p className="mb-4">
          <span className="font-medium">Name:</span> {gcashDetails.name} <br />
          <span className="font-medium">Number:</span> {gcashDetails.number}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Receipt
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {receipt && (
              <p className="mt-2 text-sm text-gray-500">Selected file: {receipt.name}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit Proof of Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentProviderCommission;