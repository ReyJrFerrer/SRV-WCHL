import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { nanoid } from "nanoid";

// Step Components
import ServiceDetails from "../../../components/provider/ServiceDetails";
import ServiceAvailability from "../../../components/provider/ServiceAvailability";
import ServiceLocation from "../../../components/provider/ServiceLocation";
import ServiceImageUpload from "../../../components/provider/ServiceImageUpload";

// Service Management Hook & Types
import {
  useServiceManagement,
  DayOfWeek,
  ServiceCreateRequest,
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

// Validation errors interface
interface ValidationErrors {
  serviceOfferingTitle?: string;
  categoryId?: string;
  servicePackages?: string;
  availabilitySchedule?: string;
  timeSlots?: string;
  locationMunicipalityCity?: string;
  general?: string;
}

// Backend validation constants (from service.mo)
const VALIDATION_LIMITS = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 1,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PRICE: 1,
  MAX_PRICE: 1_000_000,
};

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
    createService,
    createPackage,
  } = useServiceManagement();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialServiceState);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Service image upload state
  const [serviceImageFiles, setServiceImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  // Certification upload state
  const [certificationFiles, setCertificationFiles] = useState<File[]>([]);
  const [certificationPreviews, setCertificationPreviews] = useState<string[]>(
    [],
  );

  // Handle image file selection
  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setServiceImageFiles((prev) => [...prev, ...files]);
    // Generate previews in order and avoid duplicates
    const fileReaders: FileReader[] = [];
    const newPreviews: string[] = [];
    let loaded = 0;
    files.forEach((file, idx) => {
      const reader = new FileReader();
      fileReaders.push(reader);
      reader.onloadend = () => {
        newPreviews[idx] = reader.result as string;
        loaded++;
        if (loaded === files.length) {
          setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Handle certification file selection
  const handleCertificationFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setCertificationFiles((prev) => [...prev, ...files]);
    // Generate previews in order and avoid duplicates
    const fileReaders: FileReader[] = [];
    const newPreviews: string[] = [];
    let loaded = 0;
    files.forEach((file, idx) => {
      const reader = new FileReader();
      fileReaders.push(reader);
      reader.onloadend = () => {
        newPreviews[idx] = reader.result as string;
        loaded++;
        if (loaded === files.length) {
          setCertificationPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Remove image by index
  const handleRemoveImage = (index: number) => {
    setServiceImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove certification by index
  const handleRemoveCertification = (index: number) => {
    setCertificationFiles((prev) => prev.filter((_, i) => i !== index));
    setCertificationPreviews((prev) => prev.filter((_, i) => i !== index));
  };

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

  const handleNext = () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length === 0) {
      setCurrentStep((prev) => prev + 1);
      setValidationErrors({});
    } else {
      setValidationErrors(errors);
    }
  };

  const handleBack = () => setCurrentStep((prev) => prev - 1);

  // Validation function for current step
  const validateCurrentStep = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    switch (currentStep) {
      case 1: // Service Details
        // Validate service title
        if (!formData.serviceOfferingTitle.trim()) {
          errors.serviceOfferingTitle = "Service title is required";
        } else if (
          formData.serviceOfferingTitle.length <
          VALIDATION_LIMITS.MIN_TITLE_LENGTH
        ) {
          errors.serviceOfferingTitle = `Service title must be at least ${VALIDATION_LIMITS.MIN_TITLE_LENGTH} character`;
        } else if (
          formData.serviceOfferingTitle.length >
          VALIDATION_LIMITS.MAX_TITLE_LENGTH
        ) {
          errors.serviceOfferingTitle = `Service title must be no more than ${VALIDATION_LIMITS.MAX_TITLE_LENGTH} characters`;
        }

        // Validate category
        if (!formData.categoryId) {
          errors.categoryId = "Please select a category";
        }

        // Validate packages
        if (formData.servicePackages.length === 0) {
          errors.servicePackages = "At least one service package is required";
        } else {
          const hasValidPackage = formData.servicePackages.some(
            (pkg) =>
              pkg.name.trim() &&
              pkg.description.trim() &&
              pkg.price &&
              Number(pkg.price) >= VALIDATION_LIMITS.MIN_PRICE &&
              Number(pkg.price) <= VALIDATION_LIMITS.MAX_PRICE,
          );

          if (!hasValidPackage) {
            errors.servicePackages =
              "At least one complete package with valid price is required";
          }

          // Check individual package validation
          formData.servicePackages.forEach((pkg, index) => {
            if (pkg.name.trim() || pkg.description.trim() || pkg.price) {
              if (!pkg.name.trim()) {
                errors.servicePackages = `Package ${index + 1}: Name is required`;
              } else if (pkg.name.length < VALIDATION_LIMITS.MIN_TITLE_LENGTH) {
                errors.servicePackages = `Package ${index + 1}: Name must be at least ${VALIDATION_LIMITS.MIN_TITLE_LENGTH} character`;
              } else if (pkg.name.length > VALIDATION_LIMITS.MAX_TITLE_LENGTH) {
                errors.servicePackages = `Package ${index + 1}: Name must be no more than ${VALIDATION_LIMITS.MAX_TITLE_LENGTH} characters`;
              }

              if (!pkg.description.trim()) {
                errors.servicePackages = `Package ${index + 1}: Description is required`;
              } else if (
                pkg.description.length <
                VALIDATION_LIMITS.MIN_DESCRIPTION_LENGTH
              ) {
                errors.servicePackages = `Package ${index + 1}: Description must be at least ${VALIDATION_LIMITS.MIN_DESCRIPTION_LENGTH} character`;
              } else if (
                pkg.description.length >
                VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH
              ) {
                errors.servicePackages = `Package ${index + 1}: Description must be no more than ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} characters`;
              }

              if (
                !pkg.price ||
                Number(pkg.price) < VALIDATION_LIMITS.MIN_PRICE
              ) {
                errors.servicePackages = `Package ${index + 1}: Price must be at least ₱${VALIDATION_LIMITS.MIN_PRICE}`;
              } else if (Number(pkg.price) > VALIDATION_LIMITS.MAX_PRICE) {
                errors.servicePackages = `Package ${index + 1}: Price must be no more than ₱${VALIDATION_LIMITS.MAX_PRICE.toLocaleString()}`;
              }
            }
          });
        }
        break;

      case 2: // Availability
        // Validate availability schedule
        if (formData.availabilitySchedule.length === 0) {
          errors.availabilitySchedule =
            "Please select at least one day of availability";
        }

        // Validate time slots
        if (formData.useSameTimeForAllDays) {
          if (formData.commonTimeSlots.length === 0) {
            errors.timeSlots = "Please add at least one time slot";
          } else {
            // Validate each time slot
            const hasValidTimeSlot = formData.commonTimeSlots.some(
              (slot) =>
                slot.startHour &&
                slot.startMinute &&
                slot.endHour &&
                slot.endMinute,
            );
            if (!hasValidTimeSlot) {
              errors.timeSlots = "Please complete at least one time slot";
            }
          }
        } else {
          // Validate per-day time slots
          const hasTimeSlots = formData.availabilitySchedule.some(
            (day) =>
              formData.perDayTimeSlots[day] &&
              formData.perDayTimeSlots[day].length > 0,
          );
          if (!hasTimeSlots) {
            errors.timeSlots = "Please add time slots for your available days";
          }
        }
        break;

      case 3: // Location - Enhanced validation matching ClientBookingPageComponent
        // Check if using GPS location or manual address
        const hasGPSCoordinates =
          formData.locationLatitude && formData.locationLongitude;
        const hasManualAddress =
          formData.locationProvince &&
          formData.locationMunicipalityCity &&
          formData.locationBarangay &&
          formData.locationStreet &&
          formData.locationHouseNumber;

        if (!hasGPSCoordinates && !hasManualAddress) {
          errors.locationMunicipalityCity =
            "Please provide your service location by enabling GPS or entering address manually";
        } else if (!hasGPSCoordinates) {
          // Validate manual address fields
          if (!formData.locationProvince.trim()) {
            errors.locationMunicipalityCity = "Province is required";
          } else if (!formData.locationMunicipalityCity.trim()) {
            errors.locationMunicipalityCity = "Municipality/City is required";
          } else if (!formData.locationBarangay.trim()) {
            errors.locationMunicipalityCity = "Barangay is required";
          } else if (!formData.locationStreet.trim()) {
            errors.locationMunicipalityCity = "Street name is required";
          } else if (!formData.locationHouseNumber.trim()) {
            errors.locationMunicipalityCity =
              "House number/building is required";
          }
        }
        break;

      default:
        break;
    }

    return errors;
  };

  // Convert time slot format for backend
  const convertTimeSlot = (slot: TimeSlotUIData) => {
    const convertTo24Hour = (
      hour: string,
      minute: string,
      period: "AM" | "PM",
    ) => {
      let hour24 = parseInt(hour);
      if (period === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (period === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      return `${hour24.toString().padStart(2, "0")}:${minute}`;
    };

    return {
      startTime: convertTo24Hour(
        slot.startHour,
        slot.startMinute,
        slot.startPeriod,
      ),
      endTime: convertTo24Hour(slot.endHour, slot.endMinute, slot.endPeriod),
    };
  };

  // Handle service submission
  const handleSubmit = async () => {
    const errors = validateCurrentStep();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // Prepare service data
      let location;
      // Always provide non-empty strings for required fields
      if (formData.locationAddress && formData.locationAddress.trim()) {
        // Use detected address, fallback to safe defaults if missing
        let city = formData.locationMunicipalityCity?.trim() || "N/A";
        let state = formData.locationProvince?.trim() || "N/A";
        let postalCode = formData.locationPostalCode?.trim() || "0000";
        let address = formData.locationAddress?.trim() || "N/A";
        location = {
          latitude:
            formData.locationLatitude && formData.locationLatitude.trim() !== ""
              ? parseFloat(formData.locationLatitude)
              : 14.676,
          longitude:
            formData.locationLongitude &&
            formData.locationLongitude.trim() !== ""
              ? parseFloat(formData.locationLongitude)
              : 120.9822,
          address,
          city,
          state,
          country: formData.locationCountry || "Philippines",
          postalCode,
        };
      } else {
        // Manual address, fallback to safe defaults if missing
        let city = formData.locationMunicipalityCity?.trim() || "N/A";
        let state = formData.locationProvince?.trim() || "N/A";
        let postalCode = formData.locationPostalCode?.trim() || "0000";
        let address =
          [
            formData.locationHouseNumber?.trim() || "",
            formData.locationStreet?.trim() || "",
            formData.locationBarangay?.trim() || "",
          ]
            .filter(Boolean)
            .join(", ") || "N/A";
        location = {
          latitude:
            formData.locationLatitude && formData.locationLatitude.trim() !== ""
              ? parseFloat(formData.locationLatitude)
              : 14.676,
          longitude:
            formData.locationLongitude &&
            formData.locationLongitude.trim() !== ""
              ? parseFloat(formData.locationLongitude)
              : 120.9822,
          address,
          city,
          state,
          country: formData.locationCountry || "Philippines",
          postalCode,
        };
      }

      // Prepare weekly schedule
      const weeklySchedule = formData.availabilitySchedule.map((day) => ({
        day,
        availability: {
          isAvailable: true,
          slots: formData.useSameTimeForAllDays
            ? formData.commonTimeSlots.map(convertTimeSlot)
            : (formData.perDayTimeSlots[day] || []).map(convertTimeSlot),
        },
      }));

      // Create service
      const serviceRequest: ServiceCreateRequest = {
        title: formData.serviceOfferingTitle.trim(),
        description: `Service offering: ${formData.serviceOfferingTitle.trim()}`,
        categoryId: formData.categoryId,
        price: Math.min(
          ...formData.servicePackages.map((pkg) => Number(pkg.price)),
        ),
        location,
        weeklySchedule,
        instantBookingEnabled: true,
        bookingNoticeHours: 2,
        maxBookingsPerDay: 10,
      };

      console.log("Creating service with data:", serviceRequest);
      const newService = await createService(serviceRequest);
      console.log("Service created successfully:", newService);

      // Create packages for the service
      const packagePromises = formData.servicePackages
        .filter((pkg) => pkg.name.trim() && pkg.description.trim() && pkg.price)
        .map((pkg) =>
          createPackage({
            serviceId: newService.id,
            title: pkg.name.trim(),
            description: pkg.description.trim(),
            price: Number(pkg.price),
          }),
        );

      console.log("Creating packages...");
      await Promise.all(packagePromises);
      console.log("All packages created successfully");

      // Navigate to service details page
      navigate(`/provider/service-details/${newService.id}`);
    } catch (error) {
      console.error("Error creating service:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create service";
      setValidationErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            validationErrors={validationErrors}
          />
        );
      case 2:
        return (
          <ServiceAvailability
            formData={formData}
            setFormData={setFormData}
            validationErrors={validationErrors}
          />
        );
      case 3:
        return (
          <ServiceLocation
            formData={formData}
            setFormData={setFormData}
            validationErrors={validationErrors}
          />
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-800">
                Upload Service Images & Certifications
              </h2>
              <p className="mb-6 text-gray-600">
                Add images of your past work and upload certifications. This
                step is optional but highly recommended.
              </p>
            </div>
            <ServiceImageUpload
              serviceImageFiles={serviceImageFiles}
              imagePreviews={imagePreviews}
              handleImageFilesChange={handleImageFilesChange}
              handleRemoveImage={handleRemoveImage}
              certificationFiles={certificationFiles}
              certificationPreviews={certificationPreviews}
              handleCertificationFilesChange={handleCertificationFilesChange}
              handleRemoveCertification={handleRemoveCertification}
            />
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center space-y-8">
            <div className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 shadow-xl">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-blue-900">
                  Review & Submit
                </h2>
                <p className="text-gray-600">
                  Please review your service details before submitting.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    {/* Title icon: Identification/Document */}
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path d="M8 9h8M8 13h6" strokeLinecap="round" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">
                      Service Title
                    </h3>
                  </div>
                  <p className="text-gray-600">
                    {formData.serviceOfferingTitle}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    {/* Category icon: Tag */}
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 7a2 2 0 114 0 2 2 0 01-4 0z" />
                      <path d="M3 11V7a2 2 0 012-2h4l10 10a2 2 0 010 2.83l-4.17 4.17a2 2 0 01-2.83 0L3 11z" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">Category</h3>
                  </div>
                  <p className="text-gray-600">
                    {categories.find((cat) => cat.id === formData.categoryId)
                      ?.name || "Unknown"}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                  <div className="mb-4 flex items-center gap-2">
                    {/* Packages icon: Box/Package */}
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <path d="M16 3v4M8 3v4M3 7h18" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">Packages</h3>
                  </div>
                  <div className="space-y-2">
                    {formData.servicePackages
                      .filter(
                        (pkg) =>
                          pkg.name.trim() &&
                          pkg.description.trim() &&
                          pkg.price,
                      )
                      .map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between rounded border bg-gray-50 p-3"
                        >
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-sm text-gray-600">
                              {pkg.description}
                            </p>
                          </div>
                          <p className="font-semibold text-green-600">
                            ₱{Number(pkg.price).toLocaleString()}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    {/* Availability icon: Calendar */}
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M16 3v2M8 3v2M3 9h18" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">
                      Availability
                    </h3>
                  </div>
                  <p className="text-gray-600">
                    {formData.availabilitySchedule.join(", ")}
                  </p>
                  {formData.availabilitySchedule.length > 0 && (
                    <span className="mt-1 block text-sm text-gray-500">
                      {formData.useSameTimeForAllDays
                        ? `Same hours for all days (${formData.commonTimeSlots.length} time slots)`
                        : "Custom hours per day"}
                    </span>
                  )}
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    {/* Location icon: Map Pin */}
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">Location</h3>
                  </div>
                  <div className="text-gray-600">
                    {formData.locationAddress &&
                    formData.locationAddress.trim() ? (
                      <div>
                        {[
                          formData.locationAddress,
                          formData.locationMunicipalityCity,
                          formData.locationProvince,
                        ].join(", ")}
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">Manual Address: </span>
                        {[
                          formData.locationHouseNumber,
                          formData.locationStreet,
                          formData.locationBarangay,
                          formData.locationMunicipalityCity,
                          formData.locationProvince,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Service Images Preview */}
              {(serviceImageFiles.length > 0 || imagePreviews.length > 0) && (
                <div className="mt-8">
                  <div className="mb-2 flex items-center gap-2">
                    {/* Images icon: Photo */}
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <circle cx="8.5" cy="12.5" r="1.5" />
                      <path d="M21 19l-5.5-7-4.5 6-3-4-4 5" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">
                      Service Images
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {serviceImageFiles.length > 0
                      ? serviceImageFiles.map((file, idx) => (
                          <div
                            key={file.name + idx}
                            className="flex aspect-square items-center justify-center overflow-hidden rounded border border-gray-200 bg-white"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Service Image ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))
                      : imagePreviews.map((previewUrl, idx) => (
                          <div
                            key={previewUrl}
                            className="flex aspect-square items-center justify-center overflow-hidden rounded border border-gray-200 bg-white"
                          >
                            <img
                              src={previewUrl}
                              alt={`Service Image ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                  </div>
                </div>
              )}
              {/* Certifications Preview */}
              {(certificationFiles?.length > 0 ||
                certificationPreviews?.length > 0) && (
                <div className="mt-8">
                  <div className="mb-2 flex items-center gap-2">
                    {/* Certifications icon: Certificate/Award */}
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M8.21 13.89l-2.39 2.39a2 2 0 002.83 2.83l2.39-2.39m2.36-2.36l2.39 2.39a2 2 0 002.83-2.83l-2.39-2.39" />
                    </svg>
                    <h3 className="font-semibold text-gray-800">
                      Certifications
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {certificationFiles && certificationFiles.length > 0
                      ? certificationFiles.map((file, idx) => {
                          const isPdf =
                            file.type === "application/pdf" ||
                            file.name.endsWith(".pdf");
                          return (
                            <div
                              key={file.name + idx}
                              className="flex aspect-square items-center justify-center overflow-hidden rounded border border-gray-200 bg-white"
                            >
                              {isPdf ? (
                                <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
                                  <span className="material-icons text-3xl">
                                    picture_as_pdf
                                  </span>
                                  PDF File
                                </div>
                              ) : (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Certification ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          );
                        })
                      : certificationPreviews?.map((previewUrl, idx) => (
                          <div
                            key={previewUrl}
                            className="flex aspect-square items-center justify-center overflow-hidden rounded border border-gray-200 bg-white"
                          >
                            {previewUrl.endsWith(".pdf") ? (
                              <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
                                <span className="material-icons text-3xl">
                                  picture_as_pdf
                                </span>
                                PDF File
                              </div>
                            ) : (
                              <img
                                src={previewUrl}
                                alt={`Certification ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                  </div>
                </div>
              )}
              {/* Error Display */}
              {validationErrors.general && (
                <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">
                    {validationErrors.general}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
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
            Add New Service (Step {currentStep}/5)
          </h1>
        </div>
      </header>
      <main className="container mx-auto flex-grow p-4 sm:p-6">
        <div className="mt-8 rounded-xl bg-white p-6 shadow-lg sm:p-8">
          {renderStep()}
        </div>
        <div className="mt-6 mb-8 flex justify-between">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
              Back
            </button>
          )}
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ml-auto flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
                  Creating Service...
                </>
              ) : (
                "Create Service"
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddServicePage;
