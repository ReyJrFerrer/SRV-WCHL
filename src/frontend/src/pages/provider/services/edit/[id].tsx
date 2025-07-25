import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../../../../context/AuthContext";
import { nanoid } from "nanoid";

// Service Management Hook
import {
  useServiceManagement,
  EnhancedService,
  ServiceUpdateRequest,
  PackageCreateRequest,
  PackageUpdateRequest,
  DayOfWeek,
  DayAvailability,
} from "../../../../hooks/serviceManagement";

// Legacy types for UI compatibility
import {
  ServicePackage,
  ServiceCategory,
  Location,
  ProviderAvailability,
  Service,
} from "../../../../services/serviceCanisterService";

// Import AvailabilityConfiguration component
import AvailabilityConfiguration from "../../../../components/provider/AvailabilityConfiguration";
import ServiceLocation from "../../../../components/provider/ServiceLocation";

// Step Components for multi-step wizard
import ServiceDetails from "../../../../components/provider/ServiceDetails";
import ServiceAvailability from "../../../../components/provider/ServiceAvailability";

// Validation errors interface (same as add.tsx)
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

// Interfaces for form data (same as add.tsx)
interface TimeSlotUIData {
  id: string;
  startHour: string;
  startMinute: string;
  startPeriod: "AM" | "PM";
  endHour: string;
  endMinute: string;
  endPeriod: "AM" | "PM";
}

interface ServicePackageUIData {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  isPopular: boolean;
}

const initialServiceFormState = {
  serviceOfferingTitle: "",
  categoryId: "",
  locationAddress: "",

  // Enhanced Location fields (matching add.tsx)
  locationHouseNumber: "",
  locationStreet: "",
  locationBarangay: "",
  locationMunicipalityCity: "",
  locationProvince: "",
  locationCountry: "Philippines",
  locationPostalCode: "",
  locationLatitude: "",
  locationLongitude: "",

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

  requirements: "",
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
  existingHeroImage: "",
  existingMediaItems: [] as {
    type: "IMAGE" | "VIDEO";
    url: string;
    name?: string;
  }[],
  termsTitle: "",
  termsContent: "",
  termsAcceptanceRequired: false,
};

// Helper functions (timeToUIDataParts, convertServiceAvailabilityToUIData) - same as add.tsx
const timeToUIDataParts = (
  time24: string,
): { hour: string; minute: string; period: "AM" | "PM" } => {
  /* ... same as add.tsx ... */ const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(m).padStart(2, "0"),
    period: period as "AM" | "PM",
  };
};
const convertServiceAvailabilityToUIData = (
  serviceSlots: string[],
): TimeSlotUIData[] => {
  /* ... same as add.tsx ... */ if (
    !serviceSlots ||
    serviceSlots.length === 0
  ) {
    return [
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
  }
  return serviceSlots.map((slotString) => {
    const [startTime24, endTime24] = slotString.split("-");
    const startParts = timeToUIDataParts(startTime24);
    const endParts = timeToUIDataParts(endTime24);
    return {
      id: nanoid(),
      startHour: startParts.hour,
      startMinute: startParts.minute,
      startPeriod: startParts.period,
      endHour: endParts.hour,
      endMinute: endParts.minute,
      endPeriod: endParts.period,
    };
  });
};

// Helper functions for availability conversion
const convertTimeSlotUIToBackend = (slot: TimeSlotUIData): string => {
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

  const startTime = formatTimePart(
    slot.startHour,
    slot.startMinute,
    slot.startPeriod,
  );
  const endTime = formatTimePart(slot.endHour, slot.endMinute, slot.endPeriod);

  return `${startTime}-${endTime}`;
};

const convertUIAvailabilityToBackend = (
  formData: typeof initialServiceFormState,
): ProviderAvailability => {
  const weeklySchedule: Array<{
    day: DayOfWeek;
    availability: DayAvailability;
  }> = [];

  formData.availabilitySchedule.forEach((day) => {
    let timeSlots: string[] = [];

    if (formData.useSameTimeForAllDays) {
      // Use common time slots for all days
      timeSlots = formData.commonTimeSlots
        .map((slot) => convertTimeSlotUIToBackend(slot))
        .filter((slot) => slot !== null) as string[];
    } else {
      // Use per-day time slots
      const daySlots = formData.perDayTimeSlots[day] || [];
      timeSlots = daySlots
        .map((slot) => convertTimeSlotUIToBackend(slot))
        .filter((slot) => slot !== null) as string[];
    }

    if (timeSlots.length > 0) {
      weeklySchedule.push({
        day,
        availability: {
          isAvailable: true,
          slots: timeSlots.map((slotString) => {
            const [startTime, endTime] = slotString.split("-");
            return { startTime, endTime };
          }),
        },
      });
    }
  });

  return {
    weeklySchedule,
    instantBookingEnabled: formData.instantBookingEnabled,
    bookingNoticeHours: formData.bookingNoticeHours,
    maxBookingsPerDay: formData.maxBookingsPerDay,
  } as ProviderAvailability;
};

const convertBackendSlotsToUI = (
  slots: Array<{ startTime: string; endTime: string }>,
): TimeSlotUIData[] => {
  if (!slots || slots.length === 0) {
    return [
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
  }

  return slots.map((slot) => {
    const startParts = timeToUIDataParts(slot.startTime);
    const endParts = timeToUIDataParts(slot.endTime);

    return {
      id: nanoid(),
      startHour: startParts.hour,
      startMinute: startParts.minute,
      startPeriod: startParts.period,
      endHour: endParts.hour,
      endMinute: endParts.minute,
      endPeriod: endParts.period,
    };
  });
};

const EditServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, identity } = useAuth();

  // Service Management Hook Integration
  const {
    getService,
    updateService,
    getServicePackages,
    createPackage,
    updatePackage,
    deletePackage,
    updateAvailability,
    getServiceAvailability,
    categories,
    loading: hookLoading,
    error: hookError,
    clearError,
  } = useServiceManagement();

  const [serviceToEdit, setServiceToEdit] = useState<EnhancedService | null>(
    null,
  );
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [formData, setFormData] = useState(initialServiceFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Step management state (same as add.tsx)
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const [serviceImageFiles, setServiceImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const daysOfWeek: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const hourOptions = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minuteOptions = ["00", "15", "30", "45"];
  const periodOptions: ("AM" | "PM")[] = ["AM", "PM"];

  // Load service data when ID changes
  useEffect(() => {
    const loadServiceData = async () => {
      if (!id || typeof id !== "string") return;

      setPageLoading(true);
      setError(null);

      try {
        console.log("Loading service:", id);
        const service = await getService(id);

        if (service) {
          setServiceToEdit(service);

          // Load service packages
          let loadedPackages: ServicePackage[] = [];
          try {
            loadedPackages = await getServicePackages(id);
            setPackages(loadedPackages);
          } catch (packagesError) {
            console.error("Failed to load service packages:", packagesError);
            setPackages([]);
          }

          // Load availability data
          let serviceAvailability: ProviderAvailability | null = null;
          try {
            serviceAvailability = await getServiceAvailability(id);
          } catch (availabilityError) {
            console.error(
              "Failed to load service availability:",
              availabilityError,
            );
          }

          // Populate form data
          setFormData({
            serviceOfferingTitle: service.title,
            categoryId: service.category?.id || "",
            locationAddress: service.location.address,

            // Enhanced Location fields with existing data
            locationHouseNumber: "", // Could be parsed from address if needed
            locationStreet: "", // Could be parsed from address if needed
            locationBarangay: "", // Could be parsed from address if needed
            locationMunicipalityCity: service.location.city || "",
            locationProvince: service.location.state || "",
            locationCountry: service.location.country || "Philippines",
            locationPostalCode: service.location.postalCode || "",
            locationLatitude: service.location.latitude?.toString() || "",
            locationLongitude: service.location.longitude?.toString() || "",

            serviceRadius: "5",
            serviceRadiusUnit: "km" as "km" | "mi",
            // Populate availability from loaded data
            instantBookingEnabled:
              serviceAvailability?.instantBookingEnabled || false,
            bookingNoticeHours: serviceAvailability?.bookingNoticeHours || 24,
            maxBookingsPerDay: serviceAvailability?.maxBookingsPerDay || 5,
            availabilitySchedule:
              serviceAvailability?.weeklySchedule?.map((item) => item.day) ||
              [],
            useSameTimeForAllDays: true,
            commonTimeSlots:
              serviceAvailability?.weeklySchedule &&
              serviceAvailability.weeklySchedule.length > 0
                ? convertBackendSlotsToUI(
                    serviceAvailability.weeklySchedule[0].availability.slots,
                  )
                : [
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
            perDayTimeSlots: {
              Monday: [],
              Tuesday: [],
              Wednesday: [],
              Thursday: [],
              Friday: [],
              Saturday: [],
              Sunday: [],
            },
            requirements: "",
            servicePackages: loadedPackages.map((pkg: ServicePackage) => ({
              id: pkg.id,
              name: pkg.title,
              description: pkg.description,
              price: String(pkg.price),
              currency: "PHP",
              isPopular: false,
            })),
            existingHeroImage: "",
            existingMediaItems: [],
            termsTitle: "",
            termsContent: "",
            termsAcceptanceRequired: false,
          });

          setError(null);
        } else {
          throw new Error("Service not found");
        }
      } catch (err) {
        console.error("Error loading service:", err);
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setPageLoading(false);
      }
    };

    loadServiceData();
  }, [id, getService, getServicePackages, getServiceAvailability]);

  // Clear hook errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Set document title
  useEffect(() => {
    if (serviceToEdit) {
      document.title = `Edit ${serviceToEdit.title} - SRV Provider`;
    } else {
      document.title = "Edit Service - SRV Provider";
    }
  }, [serviceToEdit]);

  // Step navigation and validation functions (same as add.tsx)
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

  // Validation function for current step (adapted from add.tsx)
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      if (
        name === "useSameTimeForAllDays" ||
        name === "termsAcceptanceRequired"
      ) {
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
    /* ... same as add.tsx ... */ if (e.target.files) {
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
    /* ... same as add.tsx ... */ if (imagePreviews[indexToRemove]) {
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
  const handleCommonTimeSlotChange = (
    index: number,
    field: keyof TimeSlotUIData,
    value: string,
  ) => {
    /* ... same as add.tsx ... */ setFormData((prev) => ({
      ...prev,
      commonTimeSlots: prev.commonTimeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot,
      ),
    }));
  };
  const addCommonTimeSlot = () => {
    /* ... same as add.tsx ... */ setFormData((prev) => ({
      ...prev,
      commonTimeSlots: [
        ...prev.commonTimeSlots,
        {
          id: nanoid(),
          startHour: "09",
          startMinute: "00",
          startPeriod: "AM",
          endHour: "05",
          endMinute: "00",
          endPeriod: "PM",
        },
      ],
    }));
  };
  const removeCommonTimeSlot = (idToRemove: string) => {
    /* ... same as add.tsx ... */ setFormData((prev) => ({
      ...prev,
      commonTimeSlots: prev.commonTimeSlots.filter(
        (slot) => slot.id !== idToRemove,
      ),
    }));
  };
  const handlePerDayTimeSlotChange = (
    day: DayOfWeek,
    index: number,
    field: keyof TimeSlotUIData,
    value: string,
  ) => {
    /* ... same as add.tsx ... */ setFormData((prev) => {
      const daySlots = prev.perDayTimeSlots[day] || [];
      return {
        ...prev,
        perDayTimeSlots: {
          ...prev.perDayTimeSlots,
          [day]: daySlots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot,
          ),
        },
      };
    });
  };
  const addPerDayTimeSlot = (day: DayOfWeek) => {
    /* ... same as add.tsx ... */ setFormData((prev) => {
      const daySlots = prev.perDayTimeSlots[day] || [];
      return {
        ...prev,
        perDayTimeSlots: {
          ...prev.perDayTimeSlots,
          [day]: [
            ...daySlots,
            {
              id: nanoid(),
              startHour: "09",
              startMinute: "00",
              startPeriod: "AM",
              endHour: "05",
              endMinute: "00",
              endPeriod: "PM",
            },
          ],
        },
      };
    });
  };
  const removePerDayTimeSlot = (day: DayOfWeek, idToRemove: string) => {
    /* ... same as add.tsx ... */ setFormData((prev) => ({
      ...prev,
      perDayTimeSlots: {
        ...prev.perDayTimeSlots,
        [day]: (prev.perDayTimeSlots[day] || []).filter(
          (slot) => slot.id !== idToRemove,
        ),
      },
    }));
  };
  const handlePackageChange = (
    index: number,
    field: keyof ServicePackageUIData,
    value: string | boolean,
  ) => {
    /* ... same as add.tsx ... */ setFormData((prev) => {
      const updatedPackages = prev.servicePackages.map((pkg, i) =>
        i === index ? { ...pkg, [field]: value } : pkg,
      );
      return { ...prev, servicePackages: updatedPackages };
    });
  };
  const addPackage = () => {
    /* ... same as add.tsx ... */ setFormData((prev) => ({
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
    /* ... same as add.tsx ... */ setFormData((prev) => ({
      ...prev,
      servicePackages: prev.servicePackages.filter(
        (pkg) => pkg.id !== idToRemove,
      ),
    }));
  };
  const formatSlotTo24HourString = (slot: TimeSlotUIData): string | null => {
    /* ... same as add.tsx ... */ if (
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!isAuthenticated || !identity || !serviceToEdit) {
      setError("Authentication error or service not loaded.");
      setIsLoading(false);
      return;
    }

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

    // Validate availability schedule
    if (formData.availabilitySchedule.length === 0) {
      setError("Please select at least one working day.");
      setIsLoading(false);
      return;
    }

    const selectedCategory = categories.find(
      (c) => c.id === formData.categoryId,
    );
    if (!selectedCategory) {
      setError("Invalid category selected.");
      setIsLoading(false);
      return;
    }

    try {
      // Update the main service
      await updateService(
        serviceToEdit.id,
        String(selectedCategory.id),
        formData.serviceOfferingTitle,
        formData.serviceOfferingTitle, // description
        parseFloat(validPackages[0].price) || 0,
      );

      // Update availability
      try {
        const availabilityData = convertUIAvailabilityToBackend(formData);
        await updateAvailability(serviceToEdit.id, availabilityData);
      } catch (availabilityError) {
        console.error("Failed to update availability:", availabilityError);
        // Don't fail the entire operation, just log the error
        setError(
          `Service updated but availability update failed: ${availabilityError instanceof Error ? availabilityError.message : "Unknown error"}`,
        );
      }

      // Handle package updates
      const existingPackageIds = packages.map((pkg) => pkg.id);
      const formPackageIds = validPackages.map((pkg) => pkg.id);

      // Create new packages
      for (const pkgUI of validPackages) {
        if (!existingPackageIds.includes(pkgUI.id)) {
          const packageRequest: PackageCreateRequest = {
            serviceId: serviceToEdit.id,
            title: pkgUI.name,
            description: pkgUI.description,
            price: parseFloat(pkgUI.price) || 0,
          };
          await createPackage(packageRequest);
        } else {
          // Update existing package
          const packageRequest: PackageUpdateRequest = {
            id: pkgUI.id,
            serviceId: serviceToEdit.id,
            title: pkgUI.name,
            description: pkgUI.description,
            price: parseFloat(pkgUI.price) || 0,
          };
          await updatePackage(packageRequest);
        }
      }

      // Delete removed packages
      for (const existingId of existingPackageIds) {
        if (!formPackageIds.includes(existingId)) {
          await deletePackage(existingId);
        }
      }

      setSuccessMessage("Service updated successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
        navigate("/provider/services");
      }, 2500);
    } catch (err) {
      console.error("Failed to update service:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while updating.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (id && typeof id === "string") {
      setRetryCount((prev) => prev + 1);
      setPageLoading(true);
      setError(null);
      // Trigger reload by clearing service state
      setServiceToEdit(null);
    }
  };

  // Availability handler functions (same as add.tsx)
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

  // Show loading screen during data loading (simplified - no more "initializing system")
  if ((pageLoading || hookLoading) && !serviceToEdit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-700">Loading service details...</p>
        {retryCount > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Retry attempt: {retryCount}
          </p>
        )}
      </div>
    );
  }

  // Show error screen only if we have an error and no service data
  if ((error || hookError) && !serviceToEdit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-xl font-semibold text-red-600">
            Unable to Load Service
          </h1>
          <p className="mb-6 text-gray-600">{error || hookError}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={handleRetry}
              className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/provider/services")}
              className="rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              Back to Services
            </button>
          </div>
          {retryCount > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              Retry attempts: {retryCount}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Final fallback if no service data
  if (!serviceToEdit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-xl font-semibold text-gray-800">
            Service Not Found
          </h1>
          <p className="mb-6 text-gray-600">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/provider/services")}
            className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-gray-100">
        <header className="sticky top-0 z-20 bg-white shadow-sm">
          <div className="container mx-auto flex items-center px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="mr-2 rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="truncate text-xl font-semibold text-gray-800">
              Edit: {serviceToEdit.title}
            </h1>
          </div>
        </header>

        <main className="container mx-auto flex-grow p-4 sm:p-6">
          {successMessage && (
            <div className="mb-4 rounded-md border border-green-300 bg-green-100 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}
          {(error || hookError) && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-100 p-3 text-sm text-red-700">
              {error || hookError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl bg-white p-6 shadow-lg sm:p-8"
          >
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
                placeholder="e.g., Professional Hair Styling"
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {/* --- Service Packages Section --- */}
            <fieldset className="rounded-md border border-gray-300 p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">
                Service Packages*
              </legend>
              <p className="mb-3 text-xs text-gray-500">
                Define one or more packages. The first package's name & price
                are required.
              </p>
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
            {/* Availability Configuration */}
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
            {/* Enhanced Service Location */}
            <ServiceLocation formData={formData} setFormData={setFormData} />
            {/* Image Upload Section */}{" "}
            {/* Display Existing Images (Simplified) */}{" "}
            {/* Display New Image Previews */}
            {/* <div>
                <label htmlFor="serviceImages" className="block text-sm font-medium text-gray-700 mb-1">Service Images (New images will replace existing)</label>
                <input type="file" name="serviceImages" id="serviceImages" accept="image/png, image/jpeg, image/gif, image/svg+xml" multiple onChange={handleImageFilesChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
                
              
                {formData.existingHeroImage && (
                    <div className="mt-2">
                        <p className="text-xs text-gray-600">Current Hero Image: <span className="italic">{formData.existingHeroImage.substring(formData.existingHeroImage.lastIndexOf('/')+1) || formData.existingHeroImage}</span></p>
                    </div>
                )}
                {formData.existingMediaItems.length > 0 && (
                    <div className="mt-1">
                        <p className="text-xs text-gray-600">Current Gallery Images:</p>
                        <ul className="list-disc list-inside pl-4">
                            {formData.existingMediaItems.map((item, idx) => (
                                <li key={idx} className="text-xs text-gray-500 italic">{item.name || item.url}</li>
                            ))}
                        </ul>
                    </div>
                )}
             
                {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {imagePreviews.map((previewUrl, index) => (
                            <div key={previewUrl} className="relative group border border-gray-200 rounded-md overflow-hidden aspect-square">
                                <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 sm:p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-opacity duration-150" aria-label={`Remove image ${index + 1}`}>
                                    <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                 {serviceImageFiles.length === 0 && !formData.existingHeroImage && <p className="mt-1 text-xs text-red-500">At least one image (hero image) is required.</p>}
            </div> */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? (
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
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="mr-2 h-5 w-5" /> Save Changes
                </>
              )}
            </button>
          </form>
        </main>
      </div>
    </>
  );
};

export default EditServicePage;
