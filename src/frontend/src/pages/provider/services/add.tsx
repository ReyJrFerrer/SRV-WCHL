// SRV-ICP-ver2-jdMain/frontend/src/pages/provider/services/add.tsx
import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import Head from "next/head";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "@bundly/ares-react";
import { nanoid } from "nanoid";

// Service Management Hook
import {
  useServiceManagement,
  ServiceCreateRequest,
  PackageCreateRequest,
  EnhancedService,
  DayOfWeek,
  DayAvailability,
} from "../../../hooks/serviceManagement";

// Import only essential types from the service canister service that the hook uses
import {
  ServiceCategory,
  Location,
  ServicePackage,
} from "../../../services/serviceCanisterService";

// Import the AvailabilityConfiguration component
import AvailabilityConfiguration from "../../../components/provider/AvailabilityConfiguration";

// Interface for the structured time slot input in the form
interface TimeSlotUIData {
  id: string;
  startHour: string;
  startMinute: string;
  startPeriod: "AM" | "PM";
  endHour: string;
  endMinute: string;
  endPeriod: "AM" | "PM";
}

// Interface for package data within the form state
interface ServicePackageUIData {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  isPopular: boolean;
}

const initialServiceState = {
  serviceOfferingTitle: "",
  categoryId: "",

  // Location fields (matching client booking pattern)
  locationHouseNumber: "",
  locationStreet: "",
  locationBarangay: "",
  locationMunicipalityCity: "",
  locationProvince: "",
  locationCountry: "Philippines",
  locationPostalCode: "",
  locationLatitude: "",
  locationLongitude: "",
  locationAddress: "", // Full address string for backend compatibility
  serviceRadius: "5",
  serviceRadiusUnit: "km" as "km" | "mi",

  // Availability settings
  instantBookingEnabled: true,
  bookingNoticeHours: 24,
  maxBookingsPerDay: 5,
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
  ] as TimeSlotUIData[],
  perDayTimeSlots: {} as Record<DayOfWeek, TimeSlotUIData[]>,

  servicePackages: [
    {
      id: nanoid(),
      name: "",
      description: "",
      price: "",
      currency: "PHP",
      isPopular: false,
    },
  ] as ServicePackageUIData[],
};

const AddServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentIdentity } = useAuth();

  // Initialize service management hook
  const {
    categories,
    loading,
    loadingCategories,
    error: hookError,
    createService,
    createPackage,
    getCategories,
    getServiceAvailability,
  } = useServiceManagement();

  const [formData, setFormData] = useState(initialServiceState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [serviceImageFiles, setServiceImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Location-specific state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showGPSCoordinates, setShowGPSCoordinates] = useState(false);
  const hourOptions = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minuteOptions = ["00", "15", "30", "45"];
  const periodOptions: ("AM" | "PM")[] = ["AM", "PM"];

  useEffect(() => {
    // Load categories using the hook
    getCategories();
  }, [getCategories]);

  useEffect(() => {
    // Set default category when categories are loaded
    if (categories.length > 0 && !formData.categoryId) {
      const relevantCategories = categories.filter(
        (cat: ServiceCategory) => !cat.parentId,
      );
      if (relevantCategories.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categoryId: relevantCategories[0].id,
        }));
      }
    }
  }, [categories, formData.categoryId]);

  useEffect(() => {
    if (!formData.useSameTimeForAllDays) {
      // ... (logic for perDayTimeSlots - same as before)
      const newPerDaySlots = { ...formData.perDayTimeSlots };
      let changed = false;
      formData.availabilitySchedule.forEach((day) => {
        if (!newPerDaySlots[day] || newPerDaySlots[day].length === 0) {
          newPerDaySlots[day] = [
            {
              id: nanoid(),
              startHour: "09",
              startMinute: "00",
              startPeriod: "AM",
              endHour: "05",
              endMinute: "00",
              endPeriod: "PM",
            },
          ];
          changed = true;
        }
      });
      Object.keys(newPerDaySlots).forEach((dayKey) => {
        const day = dayKey as DayOfWeek;
        if (!formData.availabilitySchedule.includes(day)) {
          delete newPerDaySlots[day];
          changed = true;
        }
      });
      if (changed) {
        setFormData((prev) => ({ ...prev, perDayTimeSlots: newPerDaySlots }));
      }
    }
  }, [
    formData.availabilitySchedule,
    formData.useSameTimeForAllDays,
    formData.perDayTimeSlots,
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      if (name === "useSameTimeForAllDays") {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      } else if (name === "availabilitySchedule") {
        const dayValue = value as DayOfWeek;
        setFormData((prev) => {
          const currentSchedule = prev.availabilitySchedule;
          let newSchedule;
          if (checked) {
            newSchedule = Array.from(new Set([...currentSchedule, dayValue]));
          } else {
            newSchedule = currentSchedule.filter((day) => day !== dayValue);
          }
          return { ...prev, availabilitySchedule: newSchedule };
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    /* ... same as before ... */ if (e.target.files) {
      const newFilesArray = Array.from(e.target.files);
      const updatedFiles = [...serviceImageFiles];
      const updatedPreviews = [...imagePreviews];
      newFilesArray.forEach((file) => {
        if (
          !updatedFiles.find(
            (f) => f.name === file.name && f.size === file.size,
          )
        ) {
          updatedFiles.push(file);
          updatedPreviews.push(URL.createObjectURL(file));
        }
      });
      setServiceImageFiles(updatedFiles);
      setImagePreviews(updatedPreviews);
      e.target.value = "";
    }
  };
  const handleRemoveImage = (indexToRemove: number) => {
    /* ... same as before ... */ if (imagePreviews[indexToRemove]) {
      URL.revokeObjectURL(imagePreviews[indexToRemove]);
    }
    setServiceImageFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove),
    );
    setImagePreviews((prevPreviews) =>
      prevPreviews.filter((_, index) => index !== indexToRemove),
    );
  };
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handlePackageChange = (
    index: number,
    field: keyof ServicePackageUIData,
    value: string | boolean,
  ) => {
    /* ... same as before ... */ setFormData((prev) => {
      const updatedPackages = prev.servicePackages.map((pkg, i) =>
        i === index ? { ...pkg, [field]: value } : pkg,
      );
      return { ...prev, servicePackages: updatedPackages };
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
  const removePackage = (idToRemove: string) => {
    /* ... same as before ... */ setFormData((prev) => ({
      ...prev,
      servicePackages: prev.servicePackages.filter(
        (pkg) => pkg.id !== idToRemove,
      ),
    }));
  };

  // Availability handler functions
  const handleInstantBookingChange = (enabled: boolean) => {
    setFormData((prev) => ({ ...prev, instantBookingEnabled: enabled }));
  };

  const handleBookingNoticeHoursChange = (hours: number) => {
    setFormData((prev) => ({ ...prev, bookingNoticeHours: hours }));
  };

  const handleMaxBookingsPerDayChange = (count: number) => {
    setFormData((prev) => ({ ...prev, maxBookingsPerDay: count }));
  };

  const handleAvailabilityScheduleChange = (days: DayOfWeek[]) => {
    setFormData((prev) => ({ ...prev, availabilitySchedule: days }));
  };

  const handleUseSameTimeChange = (useSame: boolean) => {
    setFormData((prev) => ({ ...prev, useSameTimeForAllDays: useSame }));
  };

  const handleCommonTimeSlotsChange = (slots: TimeSlotUIData[]) => {
    setFormData((prev) => ({ ...prev, commonTimeSlots: slots }));
  };

  const handlePerDayTimeSlotsChange = (
    perDaySlots: Record<DayOfWeek, TimeSlotUIData[]>,
  ) => {
    setFormData((prev) => ({ ...prev, perDayTimeSlots: perDaySlots }));
  };

  const formatSlotTo24HourString = (slot: TimeSlotUIData): string | null => {
    /* ... same as before ... */ if (
      !slot.startHour ||
      !slot.startMinute ||
      !slot.startPeriod ||
      !slot.endHour ||
      !slot.endMinute ||
      !slot.endPeriod
    )
      return null;
    const formatTimePart = (
      hourStr: string,
      minuteStr: string,
      period: "AM" | "PM",
    ): string => {
      let hour = parseInt(hourStr, 10);
      if (period === "PM" && hour !== 12) hour += 12;
      else if (period === "AM" && hour === 12) hour = 0;
      return `${String(hour).padStart(2, "0")}:${minuteStr}`;
    };
    const startTime24 = formatTimePart(
      slot.startHour,
      slot.startMinute,
      slot.startPeriod,
    );
    const endTime24 = formatTimePart(
      slot.endHour,
      slot.endMinute,
      slot.endPeriod,
    );
    const startDateForCompare = new Date(`1970/01/01 ${startTime24}`);
    const endDateForCompare = new Date(`1970/01/01 ${endTime24}`);
    if (endDateForCompare <= startDateForCompare) return null;
    return `${startTime24}-${endTime24}`;
  };

  // Enhanced location validation function
  const validateLocationFields = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate required address fields
    if (!formData.locationStreet.trim()) {
      errors.push("Street name is required.");
    }
    if (!formData.locationBarangay.trim()) {
      errors.push("Barangay is required.");
    }
    if (!formData.locationMunicipalityCity.trim()) {
      errors.push("Municipality/City is required.");
    }
    if (!formData.locationProvince.trim()) {
      errors.push("Province is required.");
    }
    if (!formData.locationCountry.trim()) {
      errors.push("Country is required.");
    }

    // Validate GPS coordinates if provided
    if (formData.locationLatitude) {
      const lat = parseFloat(formData.locationLatitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push("Latitude must be between -90 and 90 degrees.");
      }
    }
    if (formData.locationLongitude) {
      const lng = parseFloat(formData.locationLongitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push("Longitude must be between -180 and 180 degrees.");
      }
    }

    // Validate service radius
    const radius = parseFloat(formData.serviceRadius);
    if (isNaN(radius) || radius < 1 || radius > 100) {
      errors.push("Service radius must be between 1 and 100.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Comprehensive validation function for availability settings
  const validateAvailabilitySettings = (): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Validate booking notice hours
    if (formData.bookingNoticeHours < 0 || formData.bookingNoticeHours > 720) {
      errors.push(
        "Booking notice hours must be between 0 and 720 hours (30 days).",
      );
    }

    // Validate max bookings per day
    if (formData.maxBookingsPerDay < 1 || formData.maxBookingsPerDay > 50) {
      errors.push("Maximum bookings per day must be between 1 and 50.");
    }

    // Validate working days and time slots
    if (formData.availabilitySchedule.length > 0) {
      // Check if time slots are properly configured when days are selected
      let hasValidTimeSlots = false;

      if (formData.useSameTimeForAllDays) {
        // Validate common time slots
        if (formData.commonTimeSlots.length === 0) {
          errors.push(
            "Please add at least one time slot for your working days.",
          );
        } else {
          const validCommonSlots = formData.commonTimeSlots.filter(
            (slot) =>
              slot.startHour &&
              slot.startMinute &&
              slot.startPeriod &&
              slot.endHour &&
              slot.endMinute &&
              slot.endPeriod,
          );

          if (validCommonSlots.length === 0) {
            errors.push(
              "Please complete all time slot fields for your working days.",
            );
          } else {
            // Validate that time slots are logically correct
            const invalidSlots = validCommonSlots.filter((slot) => {
              const formatted = formatSlotTo24HourString(slot);
              return formatted === null;
            });

            if (invalidSlots.length > 0) {
              errors.push(
                "Some time slots have invalid times (end time must be after start time).",
              );
            } else {
              hasValidTimeSlots = true;
            }
          }
        }
      } else {
        // Validate per-day time slots
        const daysWithSlots = formData.availabilitySchedule.filter(
          (day) =>
            formData.perDayTimeSlots[day] &&
            formData.perDayTimeSlots[day].length > 0,
        );

        if (daysWithSlots.length === 0) {
          errors.push("Please add time slots for your selected working days.");
        } else {
          let allDaysHaveValidSlots = true;

          for (const day of formData.availabilitySchedule) {
            const daySlots = formData.perDayTimeSlots[day] || [];

            if (daySlots.length === 0) {
              errors.push(`Please add time slots for ${day}.`);
              allDaysHaveValidSlots = false;
              continue;
            }

            const validDaySlots = daySlots.filter(
              (slot) =>
                slot.startHour &&
                slot.startMinute &&
                slot.startPeriod &&
                slot.endHour &&
                slot.endMinute &&
                slot.endPeriod,
            );

            if (validDaySlots.length === 0) {
              errors.push(`Please complete all time slot fields for ${day}.`);
              allDaysHaveValidSlots = false;
              continue;
            }

            const invalidDaySlots = validDaySlots.filter((slot) => {
              const formatted = formatSlotTo24HourString(slot);
              return formatted === null;
            });

            if (invalidDaySlots.length > 0) {
              errors.push(
                `${day} has invalid time slots (end time must be after start time).`,
              );
              allDaysHaveValidSlots = false;
            }
          }

          if (allDaysHaveValidSlots) {
            hasValidTimeSlots = true;
          }
        }
      }

      if (!hasValidTimeSlots && errors.length === 0) {
        errors.push("Please configure valid time slots for your working days.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!isAuthenticated || !currentIdentity) {
      setError("You must be logged in.");
      setIsLoading(false);
      return;
    }

    // Basic form validation
    const validPackages = formData.servicePackages.filter(
      (pkg) => pkg.name.trim() !== "" && pkg.price.trim() !== "",
    );
    if (
      !formData.serviceOfferingTitle.trim() ||
      validPackages.length === 0 ||
      !formData.categoryId
    ) {
      setError(
        "Please fill Offering Title, Category, and at least one complete Package (name & price).",
      );
      setIsLoading(false);
      return;
    }

    // Enhanced location validation
    const locationValidation = validateLocationFields();
    if (!locationValidation.isValid) {
      setError(`Location Error: ${locationValidation.errors.join(" ")}`);
      setIsLoading(false);
      return;
    }

    const selectedCategoryObject = categories.find(
      (c: ServiceCategory) => c.id === formData.categoryId,
    );
    if (!selectedCategoryObject) {
      setError("Invalid category selected.");
      setIsLoading(false);
      return;
    }

    // Comprehensive availability validation
    const availabilityValidation = validateAvailabilitySettings();
    if (!availabilityValidation.isValid) {
      setError(
        `Availability Settings Error: ${availabilityValidation.errors.join(" ")}`,
      );
      setIsLoading(false);
      return;
    }

    // Prepare time slots (simplified since validation is handled above)
    let finalTimeSlots: string[] = [];
    if (formData.availabilitySchedule.length > 0) {
      if (formData.useSameTimeForAllDays) {
        finalTimeSlots = formData.commonTimeSlots
          .map((slot) => formatSlotTo24HourString(slot))
          .filter(Boolean) as string[];
      } else {
        const firstScheduledDayWithSlots = formData.availabilitySchedule.find(
          (day) =>
            formData.perDayTimeSlots[day] &&
            formData.perDayTimeSlots[day].length > 0,
        );
        if (firstScheduledDayWithSlots) {
          const slotsForDay =
            formData.perDayTimeSlots[firstScheduledDayWithSlots] || [];
          finalTimeSlots = slotsForDay
            .map((slot) => formatSlotTo24HourString(slot))
            .filter(Boolean) as string[];
        }
      }
    }

    const firstValidPackage = validPackages[0];
    const mainServiceDescription =
      firstValidPackage.description || formData.serviceOfferingTitle;

    try {
      // Prepare weekly schedule for the hook
      const weeklySchedule = formData.availabilitySchedule.map((day) => ({
        day,
        availability: {
          isAvailable: true,
          slots: finalTimeSlots.map((slot) => {
            const [start, end] = slot.split("-");
            return { startTime: start, endTime: end };
          }),
        } as DayAvailability,
      }));

      // Create the service using the hook
      const createdService = await createService({
        title: formData.serviceOfferingTitle,
        description: mainServiceDescription,
        categoryId: formData.categoryId,
        price: parseInt(firstValidPackage.price) || 0,
        location: {
          address:
            formData.locationAddress ||
            [
              formData.locationHouseNumber,
              formData.locationStreet,
              formData.locationBarangay,
              formData.locationMunicipalityCity,
              formData.locationProvince,
              formData.locationCountry,
            ]
              .filter((part) => part.trim() !== "")
              .join(", "),
          city: formData.locationMunicipalityCity,
          state: formData.locationProvince,
          country: formData.locationCountry,
          postalCode: formData.locationPostalCode,
          latitude: formData.locationLatitude
            ? parseFloat(formData.locationLatitude)
            : 0,
          longitude: formData.locationLongitude
            ? parseFloat(formData.locationLongitude)
            : 0,
        } as Location,
        weeklySchedule,
        instantBookingEnabled: formData.instantBookingEnabled,
      } as ServiceCreateRequest);

      if (createdService) {
        // Create packages for the service
        for (const pkgUI of validPackages) {
          await createPackage({
            serviceId: createdService.id,
            title: pkgUI.name,
            description: pkgUI.description,
            price: parseFloat(pkgUI.price) || 0,
          } as PackageCreateRequest);
        }

        setSuccessMessage("Service added successfully!");
        setFormData(initialServiceState); // Reset form
        setServiceImageFiles([]);
        setImagePreviews([]);

        setTimeout(() => {
          setSuccessMessage(null);
          navigate("/provider/home");
        }, 2500);
      }
    } catch (err) {
      console.error("Failed to add service:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Location detection and address handling functions
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Update location coordinates
          setFormData((prev) => ({
            ...prev,
            locationLatitude: latitude.toString(),
            locationLongitude: longitude.toString(),
          }));

          setIsDetectingLocation(false);
          setShowGPSCoordinates(true); // Show GPS section when location is detected

          // In a real implementation, you could also do reverse geocoding here
          // to populate the address fields automatically
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError(
            `Could not detect location: ${error.message}. Please enter address manually.`,
          );
          setIsDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        },
      );
    } else {
      setError(
        "Geolocation is not supported by this browser. Please enter address manually.",
      );
      setIsDetectingLocation(false);
    }
  };

  const handleLocationFieldChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Update the combined address whenever individual fields change
      const addressParts = [
        updated.locationHouseNumber,
        updated.locationStreet,
        updated.locationBarangay,
        updated.locationMunicipalityCity,
        updated.locationProvince,
        updated.locationCountry,
      ].filter((part) => part.trim() !== "");

      return {
        ...updated,
        locationAddress: addressParts.join(", "),
      };
    });
  };

  return (
    <>
      <Head>
        <title>SRV | Add New Service</title>
        <meta
          name="description"
          content="Detail your new service offering and packages."
        />
      </Head>
      <div className="flex min-h-screen flex-col bg-gray-100">
        <header className="sticky top-0 z-20 bg-white shadow-sm">
          {/* ... header JSX same as before ... */}
          <div className="container mx-auto flex items-center px-4 py-3">
            <button
              onClick={() => router.back()}
              className="mr-2 rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Add New Service Offering
            </h1>
          </div>
        </header>

        <main className="container mx-auto flex-grow p-4 sm:p-6">
          {successMessage && (
            <div className="mb-4 rounded-md border border-green-300 bg-green-100 p-3 text-sm text-green-700">
              {" "}
              {successMessage}{" "}
            </div>
          )}
          {(error || hookError) && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-3 text-sm text-red-700">
              {" "}
              {error || hookError}{" "}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl bg-white p-6 shadow-lg sm:p-8"
          >
            {/* ... All previous form sections (Title, Category, Packages, Availability, Location, Requirements, Images) remain the same ... */}
            {/* Service Offering Title */}
            <div>
              <label
                htmlFor="serviceOfferingTitle"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Service Offering Title*
              </label>
              <input
                type="text"
                name="serviceOfferingTitle"
                id="serviceOfferingTitle"
                value={formData.serviceOfferingTitle}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder="e.g., Professional Hair Styling, Math Tutoring Sessions"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Category*
              </label>
              <select
                name="categoryId"
                id="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {loadingCategories ? (
                  <option disabled>Loading categories...</option>
                ) : (
                  categories
                    .filter((cat: ServiceCategory) => !cat.parentId)
                    .map((cat: ServiceCategory) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                )}
              </select>
            </div>

            {/* Service Packages Section */}
            <fieldset className="rounded-md border border-gray-300 p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">
                Service Packages*
              </legend>
              {/* ... packages mapping logic ... */}
              {formData.servicePackages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className="relative mb-4 space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4"
                >
                  <h4 className="text-sm font-semibold text-gray-800">
                    Package {index + 1}
                  </h4>
                  <div>
                    <label
                      htmlFor={`pkgName-${pkg.id}`}
                      className="mb-1 block text-xs font-medium text-gray-600"
                    >
                      Package Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      id={`pkgName-${pkg.id}`}
                      value={pkg.name}
                      onChange={(e) =>
                        handlePackageChange(index, "name", e.target.value)
                      }
                      required={index === 0}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`pkgDesc-${pkg.id}`}
                      className="mb-1 block text-xs font-medium text-gray-600"
                    >
                      Description*
                    </label>
                    <textarea
                      name="description"
                      id={`pkgDesc-${pkg.id}`}
                      value={pkg.description}
                      onChange={(e) =>
                        handlePackageChange(
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                      rows={3}
                      required={index === 0}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Describe your service package. You can specify requirements for your clients here (e.g., materials to prepare, access requirements, timing constraints)."
                    ></textarea>
                  </div>
                  <div>
                    <label
                      htmlFor={`pkgPrice-${pkg.id}`}
                      className="mb-1 block text-xs font-medium text-gray-600"
                    >
                      Price (PHP)*
                    </label>
                    <input
                      type="number"
                      name="price"
                      id={`pkgPrice-${pkg.id}`}
                      value={pkg.price}
                      onChange={(e) =>
                        handlePackageChange(index, "price", e.target.value)
                      }
                      required={index === 0}
                      step="1"
                      min="0"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  {formData.servicePackages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(pkg.id)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                      aria-label="Remove package"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPackage}
                className="mt-3 rounded-md border border-dashed border-blue-500 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                + Add Package
              </button>
            </fieldset>

            {/* Availability Section */}
            <fieldset className="rounded-md border border-gray-300 p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">
                Availability*
              </legend>
              <AvailabilityConfiguration
                instantBookingEnabled={formData.instantBookingEnabled}
                bookingNoticeHours={formData.bookingNoticeHours}
                maxBookingsPerDay={formData.maxBookingsPerDay}
                availabilitySchedule={formData.availabilitySchedule}
                useSameTimeForAllDays={formData.useSameTimeForAllDays}
                commonTimeSlots={formData.commonTimeSlots}
                perDayTimeSlots={formData.perDayTimeSlots}
                onInstantBookingChange={handleInstantBookingChange}
                onBookingNoticeHoursChange={handleBookingNoticeHoursChange}
                onMaxBookingsPerDayChange={handleMaxBookingsPerDayChange}
                onAvailabilityScheduleChange={handleAvailabilityScheduleChange}
                onUseSameTimeChange={handleUseSameTimeChange}
                onCommonTimeSlotsChange={handleCommonTimeSlotsChange}
                onPerDayTimeSlotsChange={handlePerDayTimeSlotsChange}
              />
            </fieldset>

            {/* Service Location */}
            <fieldset className="rounded-md border border-gray-300 p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">
                Service Location*
              </legend>
              <div className="space-y-4">
                {/* Current Location Detection */}
                <div className="rounded-md bg-blue-50 p-4">
                  <h4 className="mb-2 text-sm font-medium text-blue-900">
                    Auto-Detect Location
                  </h4>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 sm:w-auto"
                  >
                    {isDetectingLocation ? (
                      <>
                        <svg
                          className="mr-2 -ml-1 inline h-4 w-4 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Detecting Location...
                      </>
                    ) : (
                      "📍 Use Current Location"
                    )}
                  </button>
                  {formData.locationLatitude && formData.locationLongitude && (
                    <p className="mt-2 text-xs text-green-700">
                      ✓ Location detected:{" "}
                      {parseFloat(formData.locationLatitude).toFixed(4)}°,{" "}
                      {parseFloat(formData.locationLongitude).toFixed(4)}°
                    </p>
                  )}
                </div>

                {/* Address Fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="locationHouseNumber"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      House/Bldg Number
                    </label>
                    <input
                      type="text"
                      id="locationHouseNumber"
                      name="locationHouseNumber"
                      value={formData.locationHouseNumber}
                      onChange={(e) =>
                        handleLocationFieldChange(
                          "locationHouseNumber",
                          e.target.value,
                        )
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="locationStreet"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Street*
                    </label>
                    <input
                      type="text"
                      id="locationStreet"
                      name="locationStreet"
                      value={formData.locationStreet}
                      onChange={(e) =>
                        handleLocationFieldChange(
                          "locationStreet",
                          e.target.value,
                        )
                      }
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                      placeholder="Session Road"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="locationBarangay"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Barangay*
                    </label>
                    <input
                      type="text"
                      id="locationBarangay"
                      name="locationBarangay"
                      value={formData.locationBarangay}
                      onChange={(e) =>
                        handleLocationFieldChange(
                          "locationBarangay",
                          e.target.value,
                        )
                      }
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                      placeholder="Barangay"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="locationMunicipalityCity"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Municipality/City*
                    </label>
                    <input
                      type="text"
                      id="locationMunicipalityCity"
                      name="locationMunicipalityCity"
                      value={formData.locationMunicipalityCity}
                      onChange={(e) =>
                        handleLocationFieldChange(
                          "locationMunicipalityCity",
                          e.target.value,
                        )
                      }
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                      placeholder="Baguio City"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="locationProvince"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Province*
                    </label>
                    <input
                      type="text"
                      id="locationProvince"
                      name="locationProvince"
                      value={formData.locationProvince}
                      onChange={(e) =>
                        handleLocationFieldChange(
                          "locationProvince",
                          e.target.value,
                        )
                      }
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                      placeholder="Benguet"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="locationCountry"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Country*
                    </label>
                    <select
                      id="locationCountry"
                      name="locationCountry"
                      value={formData.locationCountry}
                      onChange={(e) =>
                        handleLocationFieldChange(
                          "locationCountry",
                          e.target.value,
                        )
                      }
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                    >
                      <option value="Philippines">Philippines</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="locationPostalCode"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="locationPostalCode"
                      name="locationPostalCode"
                      value={formData.locationPostalCode}
                      onChange={(e) =>
                        handleLocationFieldChange(
                          "locationPostalCode",
                          e.target.value,
                        )
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                      placeholder="2600"
                    />
                  </div>
                </div>

                {/* GPS Coordinates Section (Optional/Collapsible) */}
                {/* <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">GPS Coordinates (Optional)</h4>
                    <button
                      type="button"
                      onClick={() => setShowGPSCoordinates(!showGPSCoordinates)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showGPSCoordinates ? 'Hide' : 'Show'} GPS Section
                    </button>
                  </div>
                  
                  {showGPSCoordinates && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="locationLatitude" className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                        <input 
                          type="number" 
                          id="locationLatitude" 
                          name="locationLatitude"
                          value={formData.locationLatitude} 
                          onChange={(e) => handleLocationFieldChange('locationLatitude', e.target.value)}
                          step="any"
                          min="-90"
                          max="90"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="16.4145"
                        />
                        <p className="mt-1 text-xs text-gray-500">Range: -90 to 90 degrees</p>
                      </div>
                      <div>
                        <label htmlFor="locationLongitude" className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                        <input 
                          type="number" 
                          id="locationLongitude" 
                          name="locationLongitude"
                          value={formData.locationLongitude} 
                          onChange={(e) => handleLocationFieldChange('locationLongitude', e.target.value)}
                          step="any"
                          min="-180"
                          max="180"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="120.5960"
                        />
                        <p className="mt-1 text-xs text-gray-500">Range: -180 to 180 degrees</p>
                      </div>
                    </div>
                  )}
                </div> */}

                {/* Service Radius */}
                {/* <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Service Radius</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="serviceRadius" className="block text-sm font-medium text-gray-700 mb-1">Radius*</label>
                      <input 
                        type="number" 
                        id="serviceRadius" 
                        name="serviceRadius"
                        value={formData.serviceRadius} 
                        onChange={handleChange}
                        min="1"
                        max="100"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="serviceRadiusUnit" className="block text-sm font-medium text-gray-700 mb-1">Unit*</label>
                      <select 
                        id="serviceRadiusUnit" 
                        name="serviceRadiusUnit"
                        value={formData.serviceRadiusUnit} 
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="km">Kilometers</option>
                        <option value="mi">Miles</option>
                      </select>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">This is the maximum distance you're willing to travel for service delivery.</p>
                </div> */}

                {/* Generated Address Preview */}
                {formData.locationAddress && (
                  <div className="rounded-md bg-green-50 p-3">
                    <h4 className="mb-1 text-sm font-medium text-green-900">
                      Address Preview:
                    </h4>
                    <p className="text-sm text-green-800">
                      {formData.locationAddress}
                    </p>
                  </div>
                )}
              </div>
            </fieldset>

            {/* Image Upload Section */}
            <div>
              {/* <label htmlFor="serviceImages" className="block text-sm font-medium text-gray-700 mb-1">Service Images* (First image is main/hero)</label> */}
              {/* ... image upload content ... */}
              {/* <input type="file" name="serviceImages" id="serviceImages" accept="image/png, image/jpeg, image/gif, image/svg+xml" multiple onChange={handleImageFilesChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>{serviceImageFiles.length === 0 && <p className="mt-1 text-xs text-red-500">At least one image is required.</p>}{imagePreviews.length > 0 && (<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{imagePreviews.map((previewUrl, index) => (<div key={previewUrl} className="relative group border border-gray-200 rounded-md overflow-hidden aspect-square"><img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" /><button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 sm:p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity duration-150" aria-label={`Remove image ${index + 1}`}><TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" /></button></div>))}</div>)} */}
            </div>

            <button
              type="submit"
              disabled={isLoading || loading}
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading || loading ? (
                /* ... loading indicator ... */ <>
                  <svg
                    className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding Service...
                </>
              ) : (
                <>
                  <PlusCircleIcon className="mr-2 h-5 w-5" /> Add Service
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </>
  );
};

export default AddServicePage;
