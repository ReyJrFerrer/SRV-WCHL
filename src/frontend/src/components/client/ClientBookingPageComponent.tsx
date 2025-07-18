import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Principal } from '@dfinity/principal';
import serviceCanisterService, { 
  Service, 
  ServicePackage, 
  ProviderAvailability, 
  DayOfWeek,
  AvailableSlot
} from '../../services/serviceCanisterService';
import useBookRequest, { BookingRequest } from '../../hooks/bookRequest';

// Helper functions
const dayIndexToName = (dayIndex: number): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex] || '';
};

// TODO later
// Map DayOfWeek enum to day index (for Date.getDay())
const dayOfWeekToIndex = (day: DayOfWeek): number => {
  const mapping: Record<DayOfWeek, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return mapping[day];
};

interface ParsedTimeSlot {
  start: { h: number; m: number };
  end: { h: number; m: number };
}

const parseTimeSlotString = (slotStr: string): ParsedTimeSlot | null => {
  const parts = slotStr.split('-');
  if (parts.length !== 2) return null;
  const [startStr, endStr] = parts;
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return null;
  return { start: { h: startH, m: startM }, end: { h: endH, m: endM } };
};

interface SelectablePackage {
  id: string;
  title: string;
  description: string;
  price: number;
  checked: boolean;
}

// Extended service interface that includes packages
interface ExtendedService extends Service {
  packages?: ServicePackage[];
}

interface ClientBookingPageComponentProps {
  serviceSlug: string;
}

const ClientBookingPageComponent: React.FC<ClientBookingPageComponentProps> = ({ serviceSlug }) => {
  const router = useRouter();
  
  // Use the booking hook
  const {
    service: hookService,
    packages: hookPackages,
    providerProfile: hookProviderProfile, // Add this
    loading: hookLoading,
    error: hookError,
    availableSlots: hookAvailableSlots,
    isSameDayAvailable,
    loadServiceData,
    getAvailableSlots,
    createBookingRequest,
    validateBookingRequest,
    calculateTotalPrice,
    formatLocationForBooking
  } = useBookRequest();

  // Local state for form management
  const [packages, setPackages] = useState<SelectablePackage[]>([]);
  const [concerns, setConcerns] = useState<string>('');
  const [bookingOption, setBookingOption] = useState<'sameday' | 'scheduled'>('sameday');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Location state
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [municipalityCity, setMunicipalityCity] = useState('');
  const [province, setProvince] = useState('');
  const [currentLocationStatus, setCurrentLocationStatus] = useState('');
  const [useGpsLocation, setUseGpsLocation] = useState(false);
  const [showManualAddress, setShowManualAddress] = useState(false);

  // Load service data when component mounts
  useEffect(() => {
    if (serviceSlug) {
      loadServiceData(serviceSlug);
    }
  }, [serviceSlug, loadServiceData]);

  // Update local packages state when hook packages change
  useEffect(() => {
    if (hookPackages.length > 0) {
      setPackages(hookPackages.map(pkg => ({
        id: pkg.id,
        title: pkg.title,
        description: pkg.description,
        price: pkg.price,
        checked: false
      })));
    }
  }, [hookPackages]);

  // Update booking option based on same-day availability
  useEffect(() => {
    if (!isSameDayAvailable && bookingOption === 'sameday') {
      setBookingOption('scheduled');
    }
  }, [isSameDayAvailable, bookingOption]);

  // Load available slots when date is selected
  useEffect(() => {
    const loadSlots = async () => {
      if (hookService && selectedDate) {
        
        try {
          const slots = await getAvailableSlots(hookService.id, selectedDate);
          
        } catch (error) {
      
        }
      } else {
      
      }
    };
    loadSlots();
  }, [hookService, selectedDate, getAvailableSlots]);

  // Event handlers
  const handlePackageChange = (packageId: string) => {
    setFormError(null);
    setPackages(prevPackages =>
      prevPackages.map(pkg =>
        pkg.id === packageId ? { ...pkg, checked: !pkg.checked } : pkg
      )
    );
  };

  const handleBookingOptionChange = (option: 'sameday' | 'scheduled') => {
    if (option === 'sameday' && !isSameDayAvailable) return;
    setFormError(null);
    setBookingOption(option);
    if (option === 'sameday') {
      setSelectedDate(null);
      setSelectedTime('');
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (!date) {
      setSelectedTime('');
    }
    if (formError?.includes('date')) {
      setFormError(null);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (formError?.includes('time')) {
      setFormError(null);
    }
  };

  const handleUseCurrentLocation = () => {
    setCurrentLocationStatus('Fetching location...');
    setUseGpsLocation(true);
    setShowManualAddress(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocationStatus(`📍 Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)} (Using this)`);
          setHouseNumber(''); setStreet(''); setBarangay(''); setMunicipalityCity(''); setProvince('');
        },
        (error) => {
          setCurrentLocationStatus(`⚠️ Hindi makuha ang lokasyon. Ilagay nalang ito nang manu-mano. (Error: ${error.message})`);
          setUseGpsLocation(false);
          setShowManualAddress(true);
        }
      );
    } else {
      setCurrentLocationStatus("Hindi suportado ang geolocation. Ilagay nalang ang address nang manu-mano.");
      setUseGpsLocation(false);
      setShowManualAddress(true);
    }
  };

  const toggleManualAddress = () => {
    setShowManualAddress(!showManualAddress);
    if (!showManualAddress) {
      setUseGpsLocation(false);
      setCurrentLocationStatus('');
    }
  };

  const handleConfirmBooking = async () => {
    setFormError(null);

    // Validate package selection
    const anyPackageSelected = packages.some(pkg => pkg.checked);
    if (!anyPackageSelected) {
      setFormError("Pumili ng hindi bababa sa isang package ng serbisyo."
);
      return;
    }

    // Validate scheduling
    if (bookingOption === 'scheduled') {
      if (!selectedDate) {
        setFormError("Pumili ng petsa para sa iyong nakatakdang reservasyon.");
        return;
      }
      if (!selectedTime.trim()) {
        setFormError("Pumili ng oras para sa iyong nakatakdang reservasyon.");
        return;
      }
    } else if (!isSameDayAvailable) {
      setFormError("Reserbasyon ng kaparehong araw ay hindi maaari.");
      return;
    }

    // Validate location
    let finalAddress = "Walang tinukoy na address.";
    if (useGpsLocation) {
      finalAddress = currentLocationStatus;
    } else if (houseNumber || street || barangay || municipalityCity || province) {
      const addressParts = [houseNumber, street, barangay, municipalityCity, province].filter(Boolean);
      finalAddress = addressParts.join(', ');
    } else {
      setFormError("Ibigay ang iyong lokasyon (GPS o manu-manong ilagay).");
      return;
    }

    // Prepare booking data with debugging
    const selectedPackageIds = packages.filter(pkg => pkg.checked).map(pkg => pkg.id);
    

    let totalPrice = 0;
    try {
      totalPrice = calculateTotalPrice(selectedPackageIds, hookPackages);
      
      if (isNaN(totalPrice) || totalPrice < 0) {

        setFormError("Hindi makuha ang kabuuang presyo. Mangyaring subukan muli.");
        return;
      }
    } catch (error) {
      setFormError("Hindi makuha ang kabuuang presyo. Mangyaring subukan muli.");
      return;
    }

    const bookingData: BookingRequest = {
      serviceId: hookService!.id,
      serviceName: hookService!.title,
      providerId: hookService!.providerId.toString(),
      packages: packages.filter(pkg => pkg.checked),
      totalPrice,
      bookingType: bookingOption,
      scheduledDate: bookingOption === 'scheduled' ? selectedDate || undefined : undefined,
      scheduledTime: bookingOption === 'scheduled' ? selectedTime : undefined,
      location: finalAddress,
      concerns: concerns.trim() || 'Walang tiyak na mga alalahanin na nabanggit.',
    };

  

    try {
      const booking = await createBookingRequest(bookingData);
      if (booking) {
        // Prepare booking details for confirmation page
        const confirmationDetails = {
          serviceName: bookingData.serviceName,
          providerName: hookProviderProfile?.name || 'Hindi Kilalang Tagapagbigay.',
          selectedPackages: bookingData.packages.map(pkg => ({
            id: pkg.id,
            name: pkg.title
          })),
          concerns: bookingData.concerns || 'No specific concerns mentioned',
          bookingType: bookingData.bookingType === 'sameday' ? 'Same Day' : 'Scheduled',
          date: bookingData.bookingType === 'scheduled' && bookingData.scheduledDate 
            ? bookingData.scheduledDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : 'Same Day',
          time: bookingData.bookingType === 'scheduled' && bookingData.scheduledTime
            ? bookingData.scheduledTime
            : 'As soon as possible',
          location: bookingData.location
        };

        
        // Navigate to confirmation page with details
        router.push({
          pathname: '/client/booking/confirmation',
          query: { details: JSON.stringify(confirmationDetails) }
        });
      } else {
        setFormError("Nabigo ang paglikha ng reservasyon. Subukan muli.");
      }
    } catch (error) {

      setFormError("Nagkaroon ng error habang nililikha ang reservasyon. Subukan muli.");
    }
  };

  if (hookLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Naglo-load ang mga detalye ng serbisyo...</p>
        </div>
      </div>
    );
  }

  if (hookError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600">{hookError}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!hookService) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600">Hindi natagpuan ang serbisyo</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Bumalik
          </button>
        </div>
      </div>
    );
  }

  const isConfirmDisabled = 
    !packages.some(pkg => pkg.checked) ||
    (bookingOption === 'sameday' && !isSameDayAvailable) ||
    (bookingOption === 'scheduled' && (!selectedDate || !selectedTime.trim()));

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <div className="flex-grow pb-28 md:pb-24">
        <div className="md:flex md:flex-row md:gap-x-6 lg:gap-x-8 md:p-4 lg:p-6">
          {/* Left Column Wrapper */}
          <div className="md:w-1/2 md:flex md:flex-col">
            {/* Package Selection Section */}
            <div className="bg-white border-b border-gray-200 p-4 md:rounded-t-xl md:border md:shadow-sm md:border-b-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pumili ng package *</h3>
              {packages.map((pkg) => (
                <label key={pkg.id} className="flex items-start space-x-3 mb-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md">
                  <input 
                    type="checkbox" 
                    checked={pkg.checked} 
                    onChange={() => handlePackageChange(pkg.id)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{pkg.title}</div>
                    <div className="text-sm text-gray-600">{pkg.description}</div>
                    <div className="text-sm font-medium text-green-600">₱{pkg.price}</div>
                  </div>
                </label>
              ))} 
            </div>
            
            {/* Concerns Section */}
            {/* <div className="bg-white border-b border-gray-200 p-4 md:rounded-b-xl md:border-x md:border-b md:shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Concerns</h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none min-h-[80px] focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any concerns or requests..."
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
              />
            </div> */}
          </div>

          {/* Right Column Wrapper */}
          <div className="md:w-1/2 md:flex md:flex-col mt-4 md:mt-0">
            {/* Booking Schedule Section */}
            <div className="bg-white border-b border-gray-200 p-4 md:rounded-t-xl md:border md:shadow-sm md:border-b-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Iskedyul ng reserbasyon *</h3>
              
              {hookService.weeklySchedule && hookService.weeklySchedule.length > 0 && (
                <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-700 text-center">
                  <strong>
                  Available: {hookService.weeklySchedule
                    .filter(s => s.availability.isAvailable)
                    .map(s => s.day)
                    .join(', ')} | 
                  {hookService.weeklySchedule[0]?.availability?.slots?.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ') || 'No time slots available'}
                  </strong>
                </div>
              )}

              {(!hookService.weeklySchedule || hookService.weeklySchedule.length === 0) && (
                <div className="mb-4 p-2 bg-yellow-50 rounded text-sm text-yellow-700 text-center">
                  Walang itinakdang iskedyul ng availability para sa tagapagbigay na ito.
                </div>
              )}

              <div className="flex gap-3 mb-4">
                <button
                  className={`flex-1 p-3 border rounded-lg text-center ${
                    bookingOption === 'sameday' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-gray-50 text-gray-700 border-gray-300'
                  } ${!isSameDayAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500 hover:text-white'}`}
                  onClick={() => handleBookingOptionChange('sameday')}
                  disabled={!isSameDayAvailable}
                >
                  <div className="font-medium text-sm">Parehong araw</div>
                  {isSameDayAvailable && <div className="text-xs opacity-75">Makakarating sa loob ng 20-45 mins</div>}
                </button>
                <button
                  className={`flex-1 p-3 border rounded-lg text-center ${
                    bookingOption === 'scheduled' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-blue-50'
                  }`}
                  onClick={() => handleBookingOptionChange('scheduled')}
                >
                  <div className="font-medium text-sm">Iskedyul nalang</div>
                </button>
              </div>

              {bookingOption === 'scheduled' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pumili ng petsa:</label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={handleDateChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholderText="Click to select a date"
                      dateFormat="MMMM d, yyyy"
                      minDate={new Date()}
                      filterDate={(date) => {
                        if (!hookService.weeklySchedule) return false;
                        const dayName = dayIndexToName(date.getDay());
                        return hookService.weeklySchedule.some(scheduleItem => 
                          scheduleItem.day === dayName as DayOfWeek && scheduleItem.availability.isAvailable
                        );
                      }}
                    />
                  </div>
                  
                  {selectedDate && hookAvailableSlots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pumili ng oras:</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={selectedTime}
                        onChange={(e) => handleTimeChange(e.target.value)}
                      >
                        <option value="">Choose a time</option>
                        {hookAvailableSlots
                          .filter(slot => slot.isAvailable)
                          .map((slot, index) => {
                            const timeSlotValue = `${slot.timeSlot.startTime}-${slot.timeSlot.endTime}`;
                            return (
                              <option key={index} value={timeSlotValue}>
                                {slot.timeSlot.startTime} - {slot.timeSlot.endTime}
                              </option>
                            );
                          })
                        }
                      </select>
                    </div>
                  )}
                  
                  {selectedDate && hookAvailableSlots.length === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                      ⏰ Walang libreng oras para sa petsang ito. Subukan ang ibang petsa.
                    </div>
                  )}
                  
                  {!selectedDate && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                      📅 Pumili ng petsa muna upang makita ang mga libreng oras.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Location Section */}
            <div className="bg-white border-b border-gray-200 p-4 md:rounded-b-xl md:border-x md:border-b md:shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasyon ng Serbisyo *</h3>
              
              <button 
                onClick={handleUseCurrentLocation}
                className="w-full mb-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                📍 Gamitin ang kasalukuyang lokasyon.
              </button>
              
              {currentLocationStatus && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 text-center">
                  {currentLocationStatus}
                </div>
              )}
              
              {!showManualAddress && (
                <button 
                  onClick={toggleManualAddress}
                  className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Manu-manong ilagay
                </button>
              )}
              
              {showManualAddress && (
                <div className="space-y-3 mt-2">
                  <p className="text-xs text-gray-600">Ilagay ang address ng manu-mano (Lahat ay kinakailangan.*):</p>
                  <input 
                    type="text" 
                    placeholder="House No. / Unit / Building *" 
                    value={houseNumber} 
                    onChange={(e) => setHouseNumber(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Street Name *" 
                    value={street} 
                    onChange={(e) => setStreet(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Barangay *" 
                    value={barangay} 
                    onChange={(e) => setBarangay(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Municipality / City *" 
                    value={municipalityCity} 
                    onChange={(e) => setMunicipalityCity(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Province *" 
                    value={province} 
                    onChange={(e) => setProvince(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-0 md:mx-4 lg:mx-6 mt-4 md:mt-6">
          <div className="bg-white p-4 md:rounded-xl md:border md:shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Magbayad</h3>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              💸 "Tanging cash lamang ang maaaring ipangbayad."
            </div>
          </div>
          
          {formError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {formError}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-top-md">
        <button 
          onClick={handleConfirmBooking}
          disabled={isConfirmDisabled}
          className={`w-full py-3 md:py-4 rounded-lg font-semibold text-white transition-colors ${
            isConfirmDisabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Kumpirmahin ang reserbasyon.
        </button>
      </div>
    </div>
  );
};

export default ClientBookingPageComponent;
