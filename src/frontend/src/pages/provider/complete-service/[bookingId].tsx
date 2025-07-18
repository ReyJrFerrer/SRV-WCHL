import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeftIcon, CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/solid'; 
import { useProviderBookingManagement, ProviderEnhancedBooking } from '../../../hooks/useProviderBookingManagement';

const CompleteServicePage: React.FC = () => {
  const router = useRouter();
  const { bookingId } = router.query;

  const [servicePrice, setServicePrice] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [changeDue, setChangeDue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the enhanced hook instead of mock data
  const {
    getBookingById,
    completeBookingById,
    loading,
    error: hookError,
    isProviderAuthenticated
  } = useProviderBookingManagement();

  // Get booking data from hook
  const booking = useMemo(() => {
    if (bookingId && typeof bookingId === 'string') {
      return getBookingById(bookingId);
    }
    return null;
  }, [bookingId, getBookingById]);

  useEffect(() => {
    if (booking) {
      // Use the booking price as the service price
      setServicePrice(booking.price);
    }
  }, [booking]);

   useEffect(() => {
    const received = parseFloat(cashReceived);
    if (!isNaN(received) && servicePrice > 0) {
      const change = received - servicePrice;
      setChangeDue(change >= 0 ? change : 0);
    } else {
      setChangeDue(0);
    }
  }, [cashReceived, servicePrice]);

  const handleCashReceivedChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setCashReceived(value);
    }
  };

   const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const receivedAmount = parseFloat(cashReceived);

    if (isNaN(receivedAmount) || receivedAmount < servicePrice) {
      setError(`Cash received must be a number and at least ₱${servicePrice.toFixed(2)}.`);
      return;
    }
    
    if (!booking) {
      setError('Booking not found. Please try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the hook's complete function with the final price if different
      const finalPrice = receivedAmount !== servicePrice ? receivedAmount : undefined;
      const success = await completeBookingById(booking.id, finalPrice);
      
      if (success) {
        // Navigate to the receipt page
        router.push({
          pathname: `/provider/receipt/${booking.id}`,
          query: { 
            price: servicePrice.toFixed(2),
            paid: receivedAmount.toFixed(2),
            change: changeDue.toFixed(2),
            method: 'Cash'
          },
        });
      } else {
        setError('Failed to complete the booking. Please try again.');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      setError('An error occurred while completing the booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check authentication
  if (!isProviderAuthenticated()) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">Please log in as a service provider to access this page.</div>;
  }
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 p-4 text-center">Booking not found or an error occurred.</div>;
  }

  return (
    <>
      <Head>
        <title>Complete Service: {booking.serviceName || 'Service'} | SRV Provider</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3">
          <div className="container mx-auto flex items-center">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 mr-2 transition-colors" aria-label="Go back">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 truncate">Complete Service</h1>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 sm:p-6 flex justify-center items-start sm:items-center">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Payment Collection</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Finalize service for "{booking.serviceName}" with {booking.clientName}.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-700">Service Total:</span>
                <span className="text-xl font-bold text-blue-700">₱{servicePrice.toFixed(2)}</span>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label htmlFor="cashReceived" className="block text-sm font-medium text-gray-700 mb-1">
                    Cash Received from Client:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text" // Use text to allow decimal input more easily, parse to float
                      id="cashReceived"
                      name="cashReceived"
                      value={cashReceived}
                      onChange={handleCashReceivedChange}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="0.00"
                      inputMode="decimal" // Helps mobile keyboards
                      required
                    />
                  </div>
                </div>

                {parseFloat(cashReceived) >= servicePrice && servicePrice > 0 && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-green-700">Change Due:</span>
                    <span className="text-lg font-semibold text-green-700">₱{changeDue.toFixed(2)}</span>
                  </div>
                )}
                
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" /> Confirm Payment & Complete
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CompleteServicePage;