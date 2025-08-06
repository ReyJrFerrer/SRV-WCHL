import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TagIcon,
  BriefcaseIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckIcon, // For save button
  XMarkIcon, // For cancel button
  PhotoIcon, // For service images
  AcademicCapIcon, // For certifications
  PlusCircleIcon, // For adding time slots
  MinusCircleIcon, // For removing time slots
  PlusIcon, // For adding packages
} from "@heroicons/react/24/solid";
import {
  useServiceManagement,
  EnhancedService,
  DayOfWeek,
  DayAvailability,
  TimeSlot,
} from "../../../hooks/serviceManagement";
import {
  useServiceImages,
  useServiceImageUpload,
} from "../../../hooks/useImageLoader";
import BottomNavigation from "../../../components/provider/BottomNavigation";
import {
  ServicePackage,
  Location,
  ServiceCategory,
  serviceCanisterService,
} from "../../../services/serviceCanisterService";
import { mediaService } from "../../../services/mediaService";
import ViewReviewsButton from "../../../components/common/ViewReviewsButton";
import useProviderBookingManagement from "../../../hooks/useProviderBookingManagement";

// Simple Tooltip component for validation messages
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  disabled = false,
}) => {
  if (disabled) {
    // Only render tooltip if not disabled
    return (
      <div className="group relative">
        {children}
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-800 px-3 py-2 text-sm whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

interface WeeklyScheduleEntry {
  day: DayOfWeek;
  availability: DayAvailability;
}

// Helper to format time (e.g., "09:00" -> "9:00 AM")
const formatTime = (time: string) => {
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute.padStart(2, "0")} ${ampm}`;
};

// **Helper function to add hours to a time string**
const addHoursToTime = (time: string, hoursToAdd: number): string => {
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10) || 0;

  hour = hour + hoursToAdd;

  // Handle hour overflow
  if (hour >= 24) {
    hour = hour % 24;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// Availability Editor component
interface AvailabilityEditorProps {
  weeklySchedule: WeeklyScheduleEntry[];
  setWeeklySchedule: (schedule: WeeklyScheduleEntry[]) => void;
}

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  weeklySchedule,
  setWeeklySchedule,
}) => {
  const [templateTimeSlot, setTemplateTimeSlot] = useState<TimeSlot>({
    startTime: "09:00",
    endTime: "17:00",
  });

  const handleToggleDayAvailability = (index: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[index] = {
      ...newSchedule[index],
      availability: {
        ...newSchedule[index].availability,
        isAvailable: !newSchedule[index].availability.isAvailable,
      },
    };
    setWeeklySchedule(newSchedule);
  };

  // **UPDATED LOGIC HERE**
  const handleAddTimeSlot = (dayIndex: number) => {
    const newSchedule = [...weeklySchedule];
    const slots = newSchedule[dayIndex].availability.slots;

    let newSlot: TimeSlot;
    if (slots.length > 0) {
      // Get the end time of the last slot
      const lastSlotEndTime = slots[slots.length - 1].endTime;
      // Start the new slot immediately after the last one
      const newStartTime = lastSlotEndTime;
      // End the new slot 2 hours after it starts
      const newEndTime = addHoursToTime(newStartTime, 2);
      newSlot = { startTime: newStartTime, endTime: newEndTime };
    } else {
      // If no slots exist yet, use the default 9-5
      newSlot = { startTime: "09:00", endTime: "17:00" };
    }

    newSchedule[dayIndex].availability.slots.push(newSlot);
    setWeeklySchedule(newSchedule);
  };

  const handleRemoveTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].availability.slots.splice(slotIndex, 1);
    setWeeklySchedule(newSchedule);
  };

  const handleTimeChange = (
    dayIndex: number,
    slotIndex: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex].availability.slots[slotIndex][field] = value;
    setWeeklySchedule(newSchedule);
  };

  const applyTemplateToDays = (days: DayOfWeek[]) => {
    const newSchedule = [...weeklySchedule];
    newSchedule.forEach((dayEntry, index) => {
      if (days.includes(dayEntry.day)) {
        // Ensure availability is ON and replace slots with the new template slot
        newSchedule[index] = {
          ...dayEntry,
          availability: {
            isAvailable: true,
            slots: [
              {
                startTime: templateTimeSlot.startTime,
                endTime: templateTimeSlot.endTime,
              },
            ],
          },
        };
      }
    });
    setWeeklySchedule(newSchedule);
  };

  const deselectAllDays = () => {
    setWeeklySchedule(
      weeklySchedule.map((day) => ({
        ...day,
        availability: {
          ...day.availability,
          isAvailable: false,
          slots: [],
        },
      })),
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="mb-4 text-sm text-gray-600">
        Toggle availability for each day and specify time slots.
      </p>

      {/* New Time Template Section */}
      <div className="mb-4 rounded-md bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-blue-800">
          Apply a Time Slot to Multiple Days
        </h4>
        <div className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="time"
            value={templateTimeSlot.startTime}
            onChange={(e) =>
              setTemplateTimeSlot({
                ...templateTimeSlot,
                startTime: e.target.value,
              })
            }
            className="w-full rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-blue-500"
          />
          <span>-</span>
          <input
            type="time"
            value={templateTimeSlot.endTime}
            onChange={(e) =>
              setTemplateTimeSlot({
                ...templateTimeSlot,
                endTime: e.target.value,
              })
            }
            className="w-full rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2">
          <button
            onClick={() =>
              applyTemplateToDays([
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ])
            }
            className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Apply to All
          </button>
          <button
            onClick={() =>
              applyTemplateToDays([
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
              ])
            }
            className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Apply to Weekdays
          </button>
          <button
            onClick={() => applyTemplateToDays(["Sunday", "Saturday"])}
            className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Apply to Weekends
          </button>
          <button
            onClick={deselectAllDays}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Deselect All
          </button>
        </div>
      </div>

      {weeklySchedule.map((dayEntry: WeeklyScheduleEntry, dayIndex: number) => (
        <div
          key={dayEntry.day}
          className="mb-4 rounded-md border border-gray-100 p-3"
        >
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={dayEntry.availability.isAvailable}
                onChange={() => handleToggleDayAvailability(dayIndex)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              {dayEntry.day}
            </label>
            {dayEntry.availability.isAvailable && (
              <button
                onClick={() => handleAddTimeSlot(dayIndex)}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
                aria-label={`Add time slot for ${dayEntry.day}`}
              >
                <PlusCircleIcon className="mr-1 h-4 w-4" /> Add Slot
              </button>
            )}
          </div>

          {dayEntry.availability.isAvailable && (
            <div className="mt-3 space-y-3">
              {dayEntry.availability.slots.length > 0 ? (
                dayEntry.availability.slots.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        handleTimeChange(
                          dayIndex,
                          slotIndex,
                          "startTime",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        handleTimeChange(
                          dayIndex,
                          slotIndex,
                          "endTime",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveTimeSlot(dayIndex, slotIndex)}
                      className="rounded-full p-1 text-red-600 hover:bg-red-100"
                      aria-label="Remove time slot"
                    >
                      <MinusCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No time slots added.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ProviderServiceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const {
    getService,
    deleteService,
    updateServiceStatus,
    updateService,
    getStatusColor,
    getServicePackages,
    createPackage,
    updatePackage,
    deletePackage,
    error: hookError,
  } = useServiceManagement();

  const { bookings: providerBookings } = useProviderBookingManagement();

  const [service, setService] = useState<EnhancedService | null>(null);

  // Load service images using the useServiceImages hook
  const {
    images: serviceImages,
    isLoading: isLoadingImages,
    isError: isImageError,
    refetch: refetchImages,
  } = useServiceImages(service?.id, service?.imageUrls || []);

  // logging
  console.log(service);

  // Image upload hook
  const { uploadImages, removeImage } = useServiceImageUpload(service?.id);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State for Edit Modes ---
  const [editTitleCategory, setEditTitleCategory] = useState(false);
  const [editLocationAvailability, setEditLocationAvailability] =
    useState(false);
  const [editImages, setEditImages] = useState(false); // New state for images
  const [editCertifications, setEditCertifications] = useState(false); // New state for certifications

  // Image upload states
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Temporary display state for immediate UI feedback
  const [tempDisplayImages, setTempDisplayImages] = useState<
    Array<{
      url: string;
      dataUrl: string | null;
      error: string | null;
      isNew?: boolean;
    }>
  >([]);

  // Batch operations state for persistence
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<number[]>([]);

  // --- State for Package Form (Inline) ---
  const [isAddingOrEditingPackage, setIsAddingOrEditingPackage] =
    useState(false);
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);
  const [packageFormTitle, setPackageFormTitle] = useState("");
  const [packageFormDescription, setPackageFormDescription] = useState("");
  const [packageFormPrice, setPackageFormPrice] = useState("");
  const [packageFormLoading, setPackageFormLoading] = useState(false);

  // --- State for Edited Values (Temporary) ---
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedAddress, setEditedAddress] = useState("");
  const [editedCity, setEditedCity] = useState("");
  const [editedState, setEditedState] = useState("");
  const [editedPostalCode, setEditedPostalCode] = useState("");
  const [editedCountry, setEditedCountry] = useState("");
  const [editedWeeklySchedule, setEditedWeeklySchedule] = useState<
    WeeklyScheduleEntry[]
  >([]); // Adjusted type
  const [editedCertifications, setEditedCertifications] = useState<string[]>(
    [],
  ); // Assuming certification URLs or names

  // Categories state
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Set document title and initialize edit states
  useEffect(() => {
    if (service) {
      document.title = `${service.title} | SRV Provider`;
      setEditedTitle(service.title);
      setEditedCategory(service.category.id);
      setEditedAddress(service.location.address || "");
      setEditedCity(service.location.city);
      setEditedState(service.location.state || "");
      setEditedPostalCode(service.location.postalCode || "");
      setEditedCountry(service.location.country || "");
      // Ensure weeklySchedule is initialized correctly, adding 'slots' if missing
      const initialSchedule =
        service.weeklySchedule?.map((day) => ({
          ...day,
          availability: {
            ...day.availability,
            slots: day.availability.slots || [], // Ensure slots array exists
          },
        })) || [];
      setEditedWeeklySchedule(initialSchedule);
      // Initialize certification states (assuming they exist on service object)
      setEditedCertifications(service.certifications || []); // Assuming 'certifications' field
    } else {
      document.title = "Service Details | SRV Provider";
    }
  }, [service]);

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const fetchedCategories =
          await serviceCanisterService.getAllCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
        // Set empty array as fallback
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const [retryCount, setRetryCount] = useState(0);

  const hasActiveBookings = useMemo(() => {
    if (!service || !providerBookings.length) return false;
    const activeStatuses = ["Requested", "Accepted", "InProgress"];
    return providerBookings.some(
      (booking) =>
        booking.serviceId === service.id &&
        activeStatuses.includes(booking.status),
    );
  }, [service, providerBookings]);

  const activeBookingsCount = useMemo(() => {
    if (!service || !providerBookings.length) return 0;
    const activeStatuses = ["Requested", "Accepted", "InProgress"];
    return providerBookings.filter(
      (booking) =>
        booking.serviceId === service.id &&
        activeStatuses.includes(booking.status),
    ).length;
  }, [service, providerBookings]);

  // Load service data and packages
  useEffect(() => {
    const loadServiceData = async () => {
      if (!id || typeof id !== "string") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const serviceData = await getService(id);

        if (serviceData) {
          // Ensure weeklySchedule has 'slots' array for existing data
          const processedServiceData = {
            ...serviceData,
            weeklySchedule: serviceData.weeklySchedule?.map((day) => ({
              ...day,
              availability: {
                ...day.availability,
                slots: day.availability.slots || [],
              },
            })),
          };
          setService(processedServiceData);

          try {
            const servicePackages = await getServicePackages(id);
            setPackages(servicePackages || []);
          } catch (packageError) {
            console.warn("Failed to load packages:", packageError);
            setPackages([]);
          }
          setError(null);
        } else {
          throw new Error("Service not found");
        }
      } catch (err) {
        console.error("Error loading service:", err);
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setLoading(false);
      }
    };

    loadServiceData();
  }, [id, getService, getServicePackages, retryCount]);

  const handleDeleteService = async () => {
    if (!service) return;

    try {
      setIsDeleting(true);
      await deleteService(service.id);
      navigate("/provider/services");
    } catch (error) {
      console.error("Failed to delete service:", error);
      alert("Failed to delete service. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!service) return;

    const newStatus =
      service.status === "Available" ? "Unavailable" : "Available";
    setIsUpdatingStatus(true);
    try {
      await updateServiceStatus(service.id, newStatus);
      setService((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (error) {
      console.error("Failed to update service status:", error);
      alert("Failed to update service status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRetry = () => {
    if (id && typeof id === "string") {
      setRetryCount((prev) => prev + 1);
    }
  };

  // --- Edit Section Handlers ---

  const handleEditTitleCategory = useCallback(() => {
    setEditTitleCategory(true);
    if (service) {
      setEditedTitle(service.title);
      setEditedCategory(service.category.id);
    }
  }, [service]);

  const handleSaveTitleCategory = async () => {
    if (!service) return;

    if (!editedTitle.trim()) {
      alert("Service title cannot be empty.");
      return;
    }
    if (!editedCategory.trim()) {
      alert("Service category cannot be empty.");
      return;
    }

    try {
      const selectedCategory = categories.find(
        (cat) => cat.id === editedCategory,
      );

      await updateService(
        service.id,
        editedCategory,
        editedTitle,
        service.description,
        service.price,
      );
      setService((prev) =>
        prev
          ? {
              ...prev,
              title: editedTitle,
              category: {
                ...prev.category,
                id: editedCategory,
                name: selectedCategory?.name || "Unknown Category",
              },
            }
          : prev,
      );
      setEditTitleCategory(false);
    } catch (err) {
      console.error("Failed to update title/category:", err);
      alert("Failed to update title or category. Please try again.");
    }
  };

  const handleCancelTitleCategory = useCallback(() => {
    setEditTitleCategory(false);
    if (service) {
      setEditedTitle(service.title);
      setEditedCategory(service.category.id);
    }
  }, [service]);

  const handleEditLocationAvailability = useCallback(() => {
    setEditLocationAvailability(true);
    if (service) {
      setEditedAddress(service.location.address || "");
      setEditedCity(service.location.city);
      setEditedState(service.location.state || "");
      setEditedPostalCode(service.location.postalCode || "");
      setEditedCountry(service.location.country || "");
      // Revert to original service's weekly schedule, ensuring slots exist
      const originalSchedule =
        service.weeklySchedule?.map((day) => ({
          ...day,
          availability: {
            ...day.availability,
            slots: day.availability.slots || [],
          },
        })) || [];
      setEditedWeeklySchedule(originalSchedule);
    }
  }, [service]);

  const handleSaveLocationAvailability = async () => {
    if (!service) return;

    if (!editedCity.trim()) {
      alert("City cannot be empty.");
      return;
    }

    // Basic validation for time slots: start < end, no overlaps within a day (can be more robust)
    for (const day of editedWeeklySchedule) {
      if (day.availability.isAvailable) {
        for (let i = 0; i < day.availability.slots.length; i++) {
          const slotA = day.availability.slots[i];
          if (slotA.startTime >= slotA.endTime) {
            alert(
              `For ${day.day}, start time (${formatTime(slotA.startTime)}) must be before end time (${formatTime(slotA.endTime)}).`,
            );
            return;
          }
          for (let j = i + 1; j < day.availability.slots.length; j++) {
            const slotB = day.availability.slots[j];
            // Check for overlap
            if (
              slotA.startTime < slotB.endTime &&
              slotB.startTime < slotA.endTime
            ) {
              alert(
                `For ${day.day}, time slots overlap: ${formatTime(
                  slotA.startTime,
                )}-${formatTime(slotA.endTime)} and ${formatTime(
                  slotB.startTime,
                )}-${formatTime(slotB.endTime)}.`,
              );
              return;
            }
          }
        }
      }
    }

    try {
      // Create updated location object
      const updatedLocation: Location = {
        latitude: service.location.latitude, // Keep existing coordinates
        longitude: service.location.longitude,
        address: editedAddress,
        city: editedCity,
        state: editedState,
        postalCode: editedPostalCode,
        country: editedCountry,
      };

      // Update service with location and availability data
      const updatedService = await updateService(
        service.id,
        service.category.id,
        service.title,
        service.description,
        service.price,
        updatedLocation,
        editedWeeklySchedule,
        service.instantBookingEnabled,
        service.bookingNoticeHours,
        service.maxBookingsPerDay,
      );

      // Update local state with the returned service data
      setService(updatedService);
      setEditLocationAvailability(false);
    } catch (err) {
      console.error("Failed to update location/availability:", err);
      alert("Failed to update location or availability. Please try again.");
    }
  };

  const handleCancelLocationAvailability = useCallback(() => {
    setEditLocationAvailability(false);
    if (service) {
      setEditedAddress(service.location.address || "");
      setEditedCity(service.location.city);
      setEditedState(service.location.state || "");
      setEditedPostalCode(service.location.postalCode || "");
      setEditedCountry(service.location.country || "");
      // Revert to original service's weekly schedule, ensuring slots exist
      const originalSchedule =
        service.weeklySchedule?.map((day) => ({
          ...day,
          availability: {
            ...day.availability,
            slots: day.availability.slots || [],
          },
        })) || [];
      setEditedWeeklySchedule(originalSchedule);
    }
  }, [service]);

  // --- Image Upload Handlers ---
  const handleEditImages = useCallback(() => {
    setEditImages(true);
    setUploadError(null);
    // Reset pending operations
    setPendingUploads([]);
    setPendingRemovals([]);

    // Initialize temporary display with current service images
    if (serviceImages) {
      setTempDisplayImages([...serviceImages]);
    }
  }, [service, serviceImages]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files || !service) return;

    const files = Array.from(event.target.files);

    // Check if adding these files would exceed the 5 image limit
    if (tempDisplayImages.length + files.length > 5) {
      setUploadError(
        `Cannot upload ${files.length} image(s). Maximum 5 images allowed. You currently have ${tempDisplayImages.length} image(s).`,
      );
      event.target.value = "";
      return;
    }

    // Validate files using mediaService
    try {
      for (const file of files) {
        const validationError = mediaService.validateImageFile(file);
        if (validationError) {
          setUploadError(`File ${file.name}: ${validationError}`);
          event.target.value = "";
          return;
        }
      }

      // Create immediate UI feedback - show images right away
      const newDisplayImages = files.map((file) => ({
        url: URL.createObjectURL(file), // Temporary URL for display
        dataUrl: URL.createObjectURL(file),
        error: null,
        isNew: true,
      }));

      // Add to temporary display immediately
      setTempDisplayImages((prev) => [...prev, ...newDisplayImages]);

      // Add to pending uploads for later persistence
      setPendingUploads((prev) => [...prev, ...files]);
      setUploadError(null);
    } catch (error) {
      console.error("Failed to validate images:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to validate images. Please try again.",
      );
    }

    // Reset the input
    event.target.value = "";
  };

  const handleRemoveImage = async (imageIndex: number) => {
    if (!service) return;

    // Remove from temporary display immediately
    const newTempImages = [...tempDisplayImages];
    const removedImage = newTempImages[imageIndex];

    // If it's a new image (has isNew property), clean up the URL and remove from pending uploads
    if (removedImage?.isNew) {
      URL.revokeObjectURL(removedImage.url);
      // Find and remove from pending uploads
      const pendingIndex = tempDisplayImages
        .slice(0, imageIndex)
        .filter((img) => img.isNew).length;
      const newPendingUploads = [...pendingUploads];
      newPendingUploads.splice(pendingIndex, 1);
      setPendingUploads(newPendingUploads);
    } else {
      // It's an existing image, add to pending removals
      const originalIndex =
        serviceImages?.findIndex((img) => img.url === removedImage.url) ?? -1;
      if (originalIndex >= 0 && !pendingRemovals.includes(originalIndex)) {
        setPendingRemovals((prev) => [...prev, originalIndex]);
      }
    }

    // Remove from temporary display
    newTempImages.splice(imageIndex, 1);
    setTempDisplayImages(newTempImages);
    setUploadError(null);
  };

  const handleSaveImages = async () => {
    if (!service) return;

    setUploadingImages(true);
    setUploadError(null);

    try {
      // Process removals first
      if (pendingRemovals.length > 0) {
        for (const imageIndex of pendingRemovals.sort((a, b) => b - a)) {
          // Remove from end to start
          if (serviceImages && serviceImages[imageIndex]?.url) {
            await removeImage(serviceImages[imageIndex].url);
          }
        }
      }

      // Process uploads
      if (pendingUploads.length > 0) {
        await uploadImages(pendingUploads);
      }

      // Cleanup temporary URLs for new images
      tempDisplayImages.forEach((img) => {
        if (img.isNew) {
          URL.revokeObjectURL(img.url);
        }
      });

      // Reset all temporary state
      setPendingUploads([]);
      setPendingRemovals([]);
      setTempDisplayImages([]);

      // Reload the page to get fresh data
      window.location.reload();
    } catch (error) {
      console.error("Failed to save image changes:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to save image changes. Please try again.",
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCancelImages = useCallback(() => {
    // Cleanup temporary URLs for new images to prevent memory leaks
    tempDisplayImages.forEach((img) => {
      if (img.isNew) {
        URL.revokeObjectURL(img.url);
      }
    });

    // Reset all temporary state back to original
    setPendingUploads([]);
    setPendingRemovals([]);
    setTempDisplayImages(serviceImages ? [...serviceImages] : []);

    setEditImages(false);
    setUploadError(null);
  }, [service, tempDisplayImages, serviceImages]);

  // --- Certification Upload Handlers ---
  const handleEditCertifications = useCallback(() => {
    setEditCertifications(true);
    if (service) {
      setEditedCertifications(service.certifications || []);
    }
  }, [service]);

  const handleCertificationUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files || !service) return;

    // For now, certifications are static - just show a message
    alert(
      "Certification upload functionality will be implemented in a future update.",
    );

    // Reset the input
    event.target.value = "";
  };

  const handleRemoveCertification = async () => {
    if (!service) return;

    // For now, certifications are static - just show a message
    alert(
      "Certification removal functionality will be implemented in a future update.",
    );
  };

  const handleSaveCertifications = async () => {
    setEditCertifications(false);
    // Certifications are static for now
  };

  const handleCancelCertifications = useCallback(() => {
    setEditCertifications(false);
    if (service) {
      setEditedCertifications(service.certifications || []);
    }
  }, [service]);

  // --- Package Management Handlers ---
  const handleAddPackage = () => {
    setIsAddingOrEditingPackage(true);
    setCurrentPackageId(null); // Clear ID for new package
    setPackageFormTitle("");
    setPackageFormDescription("");
    setPackageFormPrice("");
  };

  const handleEditPackage = (pkg: ServicePackage) => {
    setIsAddingOrEditingPackage(true);
    setCurrentPackageId(pkg.id); // Set ID for existing package
    setPackageFormTitle(pkg.title);
    setPackageFormDescription(pkg.description);
    setPackageFormPrice(pkg.price.toString());
  };

  const handleSavePackage = async () => {
    if (!service) return;

    if (
      !packageFormTitle.trim() ||
      !packageFormDescription.trim() ||
      !packageFormPrice.trim()
    ) {
      alert("Please fill in all package fields.");
      return;
    }
    const parsedPrice = parseFloat(packageFormPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Price must be a positive number.");
      return;
    }

    setPackageFormLoading(true); // Indicate saving
    try {
      if (currentPackageId) {
        // Update existing package
        await updatePackage({
          id: currentPackageId,
          serviceId: service.id,
          title: packageFormTitle,
          description: packageFormDescription,
          price: parsedPrice,
        });
        setPackages((prev) =>
          prev.map((p) =>
            p.id === currentPackageId
              ? {
                  ...p,
                  title: packageFormTitle,
                  description: packageFormDescription,
                  price: parsedPrice,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
      } else {
        // Add new package
        const newPackage = await createPackage({
          serviceId: service.id,
          title: packageFormTitle,
          description: packageFormDescription,
          price: parsedPrice,
        });
        setPackages((prev) => [...prev, newPackage]);
      }
      handleCancelPackageEdit(); // Close the form
    } catch (err) {
      console.error("Failed to save package:", err);
      alert("Failed to save package. Please try again.");
    } finally {
      setPackageFormLoading(false);
    }
  };

  const handleCancelPackageEdit = () => {
    setIsAddingOrEditingPackage(false);
    setCurrentPackageId(null);
    setPackageFormTitle("");
    setPackageFormDescription("");
    setPackageFormPrice("");
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!service) return;

    try {
      setLoading(true); // Indicate deleting
      await deletePackage(packageId);
      setPackages((prev) => prev.filter((pkg) => pkg.id !== packageId));
    } catch (err) {
      console.error("Failed to delete package:", err);
      alert("Failed to delete package. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen during initialization or data loading
  if (loading && !service) {
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
  if ((error || hookError) && !service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-xl font-semibold text-red-600">
            Unable to Load Service
          </h1>
          <p className="mb-6 text-gray-600">
            {error || hookError || "The service could not be loaded."}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={handleRetry}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              to="/provider/services"
              className="rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Back to Services
            </Link>
          </div>
          {retryCount > 0 && (
            <p className="mt-4 text-xs text-gray-500">
              Attempted {retryCount} {retryCount === 1 ? "retry" : "retries"}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Final fallback if no service data
  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-xl font-semibold text-red-600">
            Service Not Found
          </h1>
          <p className="mb-6 text-gray-600">
            The requested service could not be found or loaded.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={handleRetry}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Try Loading Again
            </button>
            <Link
              to="/provider/services"
              className="rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-6">
          <button
            onClick={() => navigate("/provider/home")}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Go to home"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="truncate text-2xl font-semibold text-gray-800">
            Service Details
          </h1>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 p-4 sm:p-6">
        {/* Active Bookings Warning */}
        {hasActiveBookings && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Service has active bookings
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    This service has {activeBookingsCount} active booking
                    {activeBookingsCount !== 1 ? "s" : ""} and cannot be edited
                    or deleted until all bookings are completed or cancelled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Image and Basic Info Card */}
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="p-6">
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                {editTitleCategory ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-2xl font-bold text-gray-800 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Service Title"
                    />
                    <select
                      value={editedCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      disabled={categoriesLoading}
                    >
                      <option value="">
                        {categoriesLoading
                          ? "Loading categories..."
                          : "Select Category"}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <h2
                      className="truncate text-2xl font-bold text-gray-800"
                      title={service.title}
                    >
                      {service.title}
                    </h2>
                    <p className="mt-1 flex items-center text-sm text-gray-500">
                      <TagIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      {service.category.name}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`ml-2 flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-${getStatusColor(
                    service.status,
                  )}-100 text-${getStatusColor(service.status)}-700`}
                >
                  {service.status}
                </span>
                {editTitleCategory ? (
                  <>
                    <button
                      onClick={handleSaveTitleCategory}
                      className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
                      disabled={loading || hasActiveBookings}
                      aria-label="Save title and category"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelTitleCategory}
                      className="rounded-full bg-gray-200 p-2 text-gray-700 hover:bg-gray-300"
                      disabled={loading}
                      aria-label="Cancel editing title and category"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <Tooltip
                    content={`Cannot edit with ${activeBookingsCount} active booking${
                      activeBookingsCount !== 1 ? "s" : ""
                    }`}
                    disabled={hasActiveBookings}
                  >
                    <button
                      onClick={
                        hasActiveBookings ? undefined : handleEditTitleCategory
                      }
                      className={`rounded-full p-2 transition-colors hover:bg-gray-100 ${
                        hasActiveBookings ? "cursor-not-allowed opacity-50" : ""
                      }`}
                      aria-label="Edit title and category"
                      disabled={hasActiveBookings}
                    >
                      <PencilIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Sections */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-gray-700">
              Ratings
            </h3>
            <ViewReviewsButton
              serviceId={service.id}
              averageRating={service.averageRating!}
              totalReviews={service.totalReviews!}
              variant="card"
              className="mt-2"
            />
          </div>

          {/* Location & provider details */}
          <div className="space-y-5 rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b pb-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <MapPinIcon className="h-6 w-6 text-blue-500" />
                Location & Availability
              </h3>
              {editLocationAvailability ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveLocationAvailability}
                    className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
                    disabled={loading || hasActiveBookings}
                    aria-label="Save location and availability"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelLocationAvailability}
                    className="rounded-full bg-gray-200 p-2 text-gray-700 hover:bg-gray-300"
                    disabled={loading}
                    aria-label="Cancel editing location and availability"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Tooltip
                  content={`Cannot edit with ${activeBookingsCount} active booking${
                    activeBookingsCount !== 1 ? "s" : ""
                  }`}
                  disabled={hasActiveBookings}
                >
                  <button
                    onClick={
                      hasActiveBookings
                        ? undefined
                        : handleEditLocationAvailability
                    }
                    className={`rounded-full p-2 transition-colors hover:bg-gray-100 ${
                      hasActiveBookings ? "cursor-not-allowed opacity-50" : ""
                    }`}
                    aria-label="Edit location and availability"
                    disabled={hasActiveBookings}
                  >
                    <PencilIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </Tooltip>
              )}
            </div>
            {editLocationAvailability ? (
              <div className="space-y-4">
                <div>
                  <dt className="mb-1 text-xs font-semibold text-gray-500">
                    Address Line
                  </dt>
                  <input
                    type="text"
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Street Address, Building, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-gray-500">
                      City
                    </dt>
                    <input
                      type="text"
                      value={editedCity}
                      onChange={(e) => setEditedCity(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-gray-500">
                      State/Province
                    </dt>
                    <input
                      type="text"
                      value={editedState}
                      onChange={(e) => setEditedState(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="State/Province"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-gray-500">
                      Postal Code
                    </dt>
                    <input
                      type="text"
                      value={editedPostalCode}
                      onChange={(e) => setEditedPostalCode(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Postal Code"
                    />
                  </div>
                  <div>
                    <dt className="mb-1 text-xs font-semibold text-gray-500">
                      Country
                    </dt>
                    <input
                      type="text"
                      value={editedCountry}
                      onChange={(e) => setEditedCountry(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <dt className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-400" />
                    Availability
                  </dt>
                  <AvailabilityEditor
                    weeklySchedule={editedWeeklySchedule}
                    setWeeklySchedule={setEditedWeeklySchedule}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="col-span-1 sm:col-span-2">
                  <dt className="mb-1 text-xs font-semibold text-gray-500">
                    Full Address
                  </dt>
                  <dd className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800">
                    <span className="items-center gap-2 break-words">
                      <span>
                        {service.location.address && (
                          <span>{service.location.address}, </span>
                        )}
                        {service.location.city}
                        {service.location.state &&
                          `, ${service.location.state}`}
                        {service.location.postalCode &&
                          ` ${service.location.postalCode}`}
                        {service.location.country && (
                          <span className="text-gray-500">
                            , {service.location.country}
                          </span>
                        )}
                      </span>
                    </span>
                  </dd>
                </div>

                {service.weeklySchedule &&
                  service.weeklySchedule.length > 0 && (
                    <div className="mt-4 flex flex-col gap-4">
                      {/* Availability Section */}
                      <div className="col-span-1 sm:col-span-2">
                        <dt className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-500">
                          <CalendarDaysIcon className="h-4 w-4 text-blue-400" />
                          Availability
                        </dt>
                        <dd className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800">
                          {service.weeklySchedule
                            .filter((entry) => entry.availability.isAvailable)
                            .map((entry) => (
                              <div
                                key={entry.day}
                                className="flex min-w-[120px] flex-col items-start"
                              >
                                <span className="mb-1 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-700 shadow-sm">
                                  {entry.day}
                                </span>
                                <span className="text-sm font-medium text-blue-900">
                                  {entry.availability.slots &&
                                  entry.availability.slots.length > 0 ? (
                                    <ul className="ml-4 list-disc space-y-0.5">
                                      {entry.availability.slots.map(
                                        (slot, idx) => (
                                          <li
                                            key={idx}
                                            className="text-xs text-blue-800"
                                          >
                                            {formatTime(slot.startTime)} -{" "}
                                            {formatTime(slot.endTime)}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      No slots
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          {service.weeklySchedule.filter(
                            (entry) => entry.availability.isAvailable,
                          ).length === 0 && (
                            <span className="text-gray-400">Not specified</span>
                          )}
                        </dd>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>

        {/* Service Images Section */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <PhotoIcon className="h-6 w-6 text-gray-500" />
              Service Images
            </h3>
            {editImages ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveImages}
                  className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
                  disabled={uploadingImages}
                  aria-label="Save images"
                >
                  {uploadingImages ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleCancelImages}
                  className="rounded-full bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                  disabled={uploadingImages}
                  aria-label="Cancel editing images"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Tooltip
                content={`Cannot edit with ${activeBookingsCount} active booking${
                  activeBookingsCount !== 1 ? "s" : ""
                }`}
                disabled={hasActiveBookings}
              >
                <button
                  onClick={hasActiveBookings ? undefined : handleEditImages}
                  className={`rounded-full p-2 transition-colors hover:bg-gray-100 ${
                    hasActiveBookings ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  aria-label="Edit images"
                  disabled={hasActiveBookings}
                >
                  <PencilIcon className="h-5 w-5 text-gray-500" />
                </button>
              </Tooltip>
            )}
          </div>

          {editImages ? (
            <div className="space-y-4">
              {/* Upload Error Display */}
              {uploadError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XMarkIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{uploadError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Controls */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <label
                    className={`cursor-pointer rounded-lg px-4 py-2 text-white transition-colors ${
                      uploadingImages || tempDisplayImages.length >= 5
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {uploadingImages ? "Saving Changes..." : "Upload Images"}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={
                        uploadingImages || tempDisplayImages.length >= 5
                      }
                    />
                  </label>
                  {uploadingImages && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-600">
                        Saving changes...
                      </span>
                    </div>
                  )}
                </div>

                {/* Image Count and Limit Info */}
                <div className="text-sm text-gray-600">
                  <span
                    className={`${tempDisplayImages.length >= 5 ? "font-semibold text-amber-600" : ""}`}
                  >
                    {tempDisplayImages.length}/5 images
                  </span>
                  {tempDisplayImages.length >= 5 && (
                    <span className="ml-2 text-amber-600">
                      Maximum limit reached
                    </span>
                  )}
                  {(pendingUploads.length > 0 ||
                    pendingRemovals.length > 0) && (
                    <div className="mt-1 text-xs text-blue-600">
                      {pendingUploads.length > 0 &&
                        `${pendingUploads.length} pending upload(s)`}
                      {pendingUploads.length > 0 &&
                        pendingRemovals.length > 0 &&
                        ", "}
                      {pendingRemovals.length > 0 &&
                        `${pendingRemovals.length} pending removal(s)`}
                    </div>
                  )}
                </div>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {tempDisplayImages.length > 0 ? (
                  tempDisplayImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                    >
                      {image.error ? (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-red-500">
                          <div className="text-center">
                            <PhotoIcon className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-1">Failed to load</p>
                          </div>
                        </div>
                      ) : image.dataUrl ? (
                        <>
                          <img
                            src={image.dataUrl}
                            alt={`Service image ${index + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            disabled={uploadingImages}
                            className={`absolute top-1 right-1 rounded-full p-1 text-white transition-colors ${
                              uploadingImages
                                ? "cursor-not-allowed bg-gray-400"
                                : "bg-red-500 hover:bg-red-600"
                            }`}
                            aria-label="Remove image"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="col-span-full py-4 text-center text-gray-400">
                    No images uploaded yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {isLoadingImages ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading images...</span>
                </div>
              ) : isImageError ? (
                <div className="py-8 text-center text-red-500">
                  <p>Failed to load service images</p>
                  <button
                    onClick={() => refetchImages()}
                    className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    Try again
                  </button>
                </div>
              ) : serviceImages && serviceImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {serviceImages.map((image: any, index: number) => (
                    <div
                      key={index}
                      className="aspect-video overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                    >
                      {image.error ? (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-red-500">
                          <div className="text-center">
                            <PhotoIcon className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-1">Failed to load</p>
                          </div>
                        </div>
                      ) : image.dataUrl ? (
                        <img
                          src={image.dataUrl}
                          alt={`Service image ${index + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <PhotoIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>No service images available.</p>
                  <p className="mt-2 text-sm">
                    Images help customers see what your service offers.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Certifications Section */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <AcademicCapIcon className="h-6 w-6 text-gray-500" />
              Certifications
            </h3>
            {editCertifications ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCertifications}
                  className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading}
                  aria-label="Save certifications"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelCertifications}
                  className="rounded-full bg-gray-200 p-2 text-gray-700 hover:bg-gray-300"
                  disabled={loading}
                  aria-label="Cancel editing certifications"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Tooltip
                content={`Cannot edit with ${activeBookingsCount} active booking${
                  activeBookingsCount !== 1 ? "s" : ""
                }`}
                disabled={hasActiveBookings}
              >
                <button
                  onClick={
                    hasActiveBookings ? undefined : handleEditCertifications
                  }
                  className={`rounded-full p-2 transition-colors hover:bg-gray-100 ${
                    hasActiveBookings ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  aria-label="Edit certifications"
                  disabled={hasActiveBookings}
                >
                  <PencilIcon className="h-5 w-5 text-gray-500" />
                </button>
              </Tooltip>
            )}
          </div>

          {editCertifications ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                  Upload Certifications
                  <input
                    type="file"
                    multiple // Allow multiple files for certifications
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" // Example file types
                    className="hidden"
                    onChange={handleCertificationUpload}
                  />
                </label>
                <span className="text-sm text-gray-600">
                  (Upload PDF, images, etc.)
                </span>
              </div>
              <ul className="space-y-2">
                {editedCertifications.length > 0 ? (
                  editedCertifications.map((certName, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded-md bg-gray-100 p-2 text-sm text-gray-800"
                    >
                      <span>{certName}</span>
                      <button
                        onClick={() => handleRemoveCertification()}
                        className="rounded-full p-1 text-red-600 hover:bg-red-100"
                        aria-label="Remove certification"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="py-4 text-center text-gray-400">
                    No certifications uploaded yet.
                  </p>
                )}
              </ul>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              {service.certifications && service.certifications.length > 0 ? (
                <ul className="space-y-2">
                  {service.certifications.map((certName, index) => (
                    <li
                      key={index}
                      className="rounded-md bg-gray-50 p-2 text-sm text-gray-800"
                    >
                      {certName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No certifications available.</p>
              )}
            </div>
          )}
        </div>

        {/* Service Packages Section */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <BriefcaseIcon className="h-6 w-6 text-gray-500" />
              Service Packages ({packages.length})
            </h3>
            {!isAddingOrEditingPackage && (
              <Tooltip
                content={`Cannot add/edit packages with ${activeBookingsCount} active booking${
                  activeBookingsCount !== 1 ? "s" : ""
                }`}
                disabled={hasActiveBookings}
              >
                <button
                  onClick={hasActiveBookings ? undefined : handleAddPackage}
                  className={`inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 ${
                    hasActiveBookings ? "cursor-not-allowed" : ""
                  }`}
                  disabled={hasActiveBookings}
                >
                  <PlusIcon className="mr-1 h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Add Package</span>
                </button>
              </Tooltip>
            )}
          </div>
          <div className="space-y-4">
            {isAddingOrEditingPackage && (
              <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-inner">
                <h4 className="mb-3 text-lg font-semibold text-blue-800">
                  {currentPackageId ? "Edit Package" : "Add New Package"}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="packageTitle"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="packageTitle"
                      value={packageFormTitle}
                      onChange={(e) => setPackageFormTitle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Basic Cleaning, Premium Tune-up"
                      required
                      disabled={packageFormLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="packageDescription"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="packageDescription"
                      value={packageFormDescription}
                      onChange={(e) =>
                        setPackageFormDescription(e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Brief description of what's included in this package"
                      required
                      disabled={packageFormLoading}
                    ></textarea>
                  </div>
                  <div>
                    <label
                      htmlFor="packagePrice"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Price (₱)
                    </label>
                    <input
                      type="number"
                      id="packagePrice"
                      value={packageFormPrice}
                      onChange={(e) => setPackageFormPrice(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., 500.00"
                      required
                      disabled={packageFormLoading}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelPackageEdit}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                      disabled={packageFormLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePackage}
                      className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                      disabled={packageFormLoading}
                    >
                      {packageFormLoading
                        ? "Saving..."
                        : currentPackageId
                          ? "Update Package"
                          : "Create Package"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {packages.length > 0
              ? packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-md font-semibold text-gray-800">
                          {pkg.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {pkg.description}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="text-md font-semibold text-green-600">
                          ₱{pkg.price.toFixed(2)}
                        </span>
                        <Tooltip
                          content={`Cannot edit with ${activeBookingsCount} active booking${
                            activeBookingsCount !== 1 ? "s" : ""
                          }`}
                          disabled={hasActiveBookings}
                        >
                          <button
                            onClick={
                              hasActiveBookings
                                ? undefined
                                : () => handleEditPackage(pkg)
                            }
                            className={`rounded-full p-1 text-gray-500 hover:bg-gray-200 ${
                              hasActiveBookings
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                            aria-label={`Edit ${pkg.title}`}
                            disabled={
                              hasActiveBookings || isAddingOrEditingPackage
                            } // Disable if another package is being edited/added
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip
                          content={`Cannot delete with ${activeBookingsCount} active booking${
                            activeBookingsCount !== 1 ? "s" : ""
                          }`}
                          disabled={hasActiveBookings}
                        >
                          <button
                            onClick={
                              hasActiveBookings
                                ? undefined
                                : () => handleDeletePackage(pkg.id)
                            }
                            className={`rounded-full p-1 text-red-600 hover:bg-red-100 ${
                              hasActiveBookings
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                            aria-label={`Delete ${pkg.title}`}
                            disabled={
                              hasActiveBookings || isAddingOrEditingPackage
                            } // Disable if another package is being edited/added
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Created: {new Date(pkg.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Updated: {new Date(pkg.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              : !isAddingOrEditingPackage && ( // Only show placeholder if no packages and not adding
                  <div className="py-8 text-center">
                    <BriefcaseIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p className="mb-4 text-gray-500">
                      No packages available for this service
                    </p>
                    <p className="text-sm text-gray-400">
                      Packages help customers choose specific service options
                      with different pricing
                    </p>
                  </div>
                )}
          </div>
        </div>

        {/* Action Buttons Card */}
        <div className="mb-8 flex flex-col gap-2 rounded-xl bg-white p-4 shadow-lg sm:flex-row sm:gap-3">
          {/* Deactivate/Activate Button */}
          <button
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors duration-150 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:outline-none disabled:opacity-60 ${
              service.status === "Available"
                ? "text-yellow-600 hover:bg-yellow-500 hover:text-white"
                : "text-green-600 hover:bg-green-500 hover:text-white"
            }`}
          >
            {service.status === "Available" ? (
              <LockClosedIcon className="h-5 w-5" />
            ) : (
              <LockOpenIcon className="h-5 w-5" />
            )}
            {isUpdatingStatus
              ? "Updating..."
              : service.status === "Available"
                ? "Deactivate"
                : "Activate"}
          </button>

          {/* Delete Service Button */}
          <Tooltip
            content={`Cannot delete service with ${activeBookingsCount} active booking${
              activeBookingsCount !== 1 ? "s" : ""
            }`}
            disabled={hasActiveBookings}
          >
            <button
              onClick={hasActiveBookings ? undefined : handleDeleteService}
              disabled={isDeleting || hasActiveBookings}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors duration-150 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none disabled:opacity-60 ${
                hasActiveBookings
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-red-500 hover:text-white"
              }`}
              tabIndex={hasActiveBookings ? -1 : 0}
            >
              <TrashIcon className="h-5 w-5" />
              {isDeleting ? "Deleting..." : "Delete Service"}
            </button>
          </Tooltip>
        </div>
      </main>

      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
};

export default ProviderServiceDetailPage;
