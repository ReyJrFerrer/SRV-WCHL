import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../../../context/AuthContext";
import { nanoid } from "nanoid";

// Step Components
import ServiceDetails from "../../../components/provider/ServiceDetails";
import ServiceAvailability from "../../../components/provider/ServiceAvailability";
import ServiceLocation from "../../../components/provider/ServiceLocation";

// Service Management Hook & Types
import {
  useServiceManagement,
  DayOfWeek,
} from "../../../hooks/serviceManagement";

import { ServiceCategory } from "../../../services/serviceCanisterService";

// Define TimeSlotUIData interface to ensure type consistency
interface TimeSlotUIData {
  id: string;
  startHour: string;
  startMinute: string;
  startPeriod: "AM" | "PM";
  endHour: string;
  endMinute: string;
  endPeriod: "AM" | "PM";
}

const initialServiceState = {
  serviceOfferingTitle: "",
  categoryId: "",
  servicePackages: [
    {
      id: nanoid(),
      name: "",
      description: "",
      price: "",
      currency: "PHP",
      isPopular: false,
    },
  ],
  // Availability fields
  availabilitySchedule: [] as DayOfWeek[],
  useSameTimeForAllDays: true,
  commonTimeSlots: [
    {
      id: nanoid(),
      startHour: "09",
      startMinute: "00",
      startPeriod: "AM" as "AM" | "PM",
      endHour: "05",
      endMinute: "00",
      endPeriod: "PM" as "AM" | "PM",
    },
  ],
  perDayTimeSlots: {} as Record<DayOfWeek, TimeSlotUIData[]>,
  // Location fields
  locationHouseNumber: "",
  locationStreet: "",
  locationBarangay: "",
  locationMunicipalityCity: "",
  locationProvince: "",
  locationCountry: "Philippines",
  locationPostalCode: "",
  locationLatitude: "",
  locationLongitude: "",
  locationAddress: "",
  serviceRadius: "5",
  serviceRadiusUnit: "km" as "km" | "mi",
};

const AddServicePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    categories,
    loading: loadingCategories,
    getCategories,
  } = useServiceManagement();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialServiceState);

  useEffect(() => {
    getCategories();
    document.title = "Add Service - SRV Provider";
  }, [getCategories]);

  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      const defaultCategory = categories.find(
        (cat: ServiceCategory) => !cat.parentId,
      );
      if (defaultCategory) {
        setFormData((prev) => ({ ...prev, categoryId: defaultCategory.id }));
      }
    }
  }, [categories, formData.categoryId]);

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePackageChange = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    setFormData((prev) => {
      const servicePackages = [...prev.servicePackages];
      servicePackages[index] = { ...servicePackages[index], [field]: value };
      return { ...prev, servicePackages };
    });
  };

  const addPackage = () => {
    setFormData((prev) => ({
      ...prev,
      servicePackages: [
        ...prev.servicePackages,
        {
          id: nanoid(),
          name: "",
          description: "",
          price: "",
          currency: "PHP",
          isPopular: false,
        },
      ],
    }));
  };

  const removePackage = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      servicePackages: prev.servicePackages.filter((p) => p.id !== id),
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ServiceDetails
            formData={formData}
            categories={categories}
            loadingCategories={loadingCategories}
            handleChange={handleChange}
            handlePackageChange={handlePackageChange}
            addPackage={addPackage}
            removePackage={removePackage}
          />
        );
      case 2:
        return (
          <ServiceAvailability formData={formData} setFormData={setFormData} />
        );
      case 3:
        return (
          <ServiceLocation formData={formData} setFormData={setFormData} />
        );
      case 4:
        return <div>Service Images Page - To be implemented</div>;
      default:
        return <div>Review and Submit</div>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="container mx-auto flex items-center px-4 py-3">
          <button
            onClick={() => (currentStep === 1 ? navigate(-1) : handleBack())}
            className="mr-2 rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Add New Service (Step {currentStep}/4)
          </h1>
        </div>
      </header>
      <main className="container mx-auto flex-grow p-4 sm:p-6">
        <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
          {renderStep()}
        </div>
        <div className="mt-6 flex justify-between">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Back
            </button>
          )}
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button className="ml-auto rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              Submit
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddServicePage;
