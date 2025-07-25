import React from "react";
import { DayOfWeek } from "../../hooks/serviceManagement";
import { TrashIcon } from "@heroicons/react/24/solid";
import { nanoid } from "nanoid";

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

interface ServiceAvailabilityProps {
  formData: {
    availabilitySchedule: DayOfWeek[];
    useSameTimeForAllDays: boolean;
    commonTimeSlots: TimeSlotUIData[];
    perDayTimeSlots: Record<DayOfWeek, TimeSlotUIData[]>;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors?: {
    availabilitySchedule?: string;
    timeSlots?: string;
  };
}

const allDays: DayOfWeek[] = [
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

const TimeSlotInput: React.FC<{
  slot: TimeSlotUIData;
  onSlotChange: (
    id: string,
    field: keyof TimeSlotUIData,
    value: string,
  ) => void;
  onRemoveSlot: (id: string) => void;
}> = ({ slot, onSlotChange, onRemoveSlot }) => (
  <div className="mb-2 flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center">
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex gap-2">
        <select
          value={slot.startHour}
          onChange={(e) => onSlotChange(slot.id, "startHour", e.target.value)}
          className="rounded-md border-gray-300 text-sm"
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          value={slot.startMinute}
          onChange={(e) => onSlotChange(slot.id, "startMinute", e.target.value)}
          className="rounded-md border-gray-300 text-sm"
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={slot.startPeriod}
          onChange={(e) => onSlotChange(slot.id, "startPeriod", e.target.value)}
          className="rounded-md border-gray-300 text-sm"
        >
          {periodOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <span className="hidden text-gray-500 sm:inline">-</span>
      <div className="mt-2 flex gap-2 sm:mt-0">
        <select
          value={slot.endHour}
          onChange={(e) => onSlotChange(slot.id, "endHour", e.target.value)}
          className="rounded-md border-gray-300 text-sm"
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          value={slot.endMinute}
          onChange={(e) => onSlotChange(slot.id, "endMinute", e.target.value)}
          className="rounded-md border-gray-300 text-sm"
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={slot.endPeriod}
          onChange={(e) => onSlotChange(slot.id, "endPeriod", e.target.value)}
          className="rounded-md border-gray-300 text-sm"
        >
          {periodOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onRemoveSlot(slot.id)}
      className="self-end text-red-500 hover:text-red-700 sm:ml-auto"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  </div>
);

const ServiceAvailability: React.FC<ServiceAvailabilityProps> = ({
  formData,
  setFormData,
  validationErrors = {},
}) => {
  const handleDayToggle = (day: DayOfWeek) => {
    setFormData((prev: { availabilitySchedule: DayOfWeek[] }) => {
      const newSchedule = prev.availabilitySchedule.includes(day)
        ? prev.availabilitySchedule.filter((d: any) => d !== day)
        : [...prev.availabilitySchedule, day];
      return { ...prev, availabilitySchedule: newSchedule };
    });
  };

  const handleTimeSlotChange = (
    day: DayOfWeek | "common",
    id: string,
    field: keyof TimeSlotUIData,
    value: string,
  ) => {
    setFormData(
      (prev: {
        commonTimeSlots: any[];
        perDayTimeSlots: { [x: string]: any[] };
      }) => {
        if (day === "common") {
          const commonTimeSlots = prev.commonTimeSlots.map(
            (slot: { id: string }) =>
              slot.id === id ? { ...slot, [field]: value } : slot,
          );
          return { ...prev, commonTimeSlots };
        }
        const perDayTimeSlots = {
          ...prev.perDayTimeSlots,
          [day]: prev.perDayTimeSlots[day].map((slot: { id: string }) =>
            slot.id === id ? { ...slot, [field]: value } : slot,
          ),
        };
        return { ...prev, perDayTimeSlots };
      },
    );
  };

  const addTimeSlot = (day: DayOfWeek | "common") => {
    const newSlot: TimeSlotUIData = {
      id: nanoid(),
      startHour: "09",
      startMinute: "00",
      startPeriod: "AM",
      endHour: "05",
      endMinute: "00",
      endPeriod: "PM",
    };
    setFormData(
      (prev: {
        commonTimeSlots: any;
        perDayTimeSlots: { [x: string]: any };
      }) => {
        if (day === "common") {
          return {
            ...prev,
            commonTimeSlots: [...prev.commonTimeSlots, newSlot],
          };
        }
        return {
          ...prev,
          perDayTimeSlots: {
            ...prev.perDayTimeSlots,
            [day]: [...(prev.perDayTimeSlots[day] || []), newSlot],
          },
        };
      },
    );
  };

  const removeTimeSlot = (day: DayOfWeek | "common", id: string) => {
    setFormData(
      (prev: {
        commonTimeSlots: any[];
        perDayTimeSlots: { [x: string]: any[] };
      }) => {
        if (day === "common") {
          return {
            ...prev,
            commonTimeSlots: prev.commonTimeSlots.filter(
              (slot: { id: string }) => slot.id !== id,
            ),
          };
        }
        return {
          ...prev,
          perDayTimeSlots: {
            ...prev.perDayTimeSlots,
            [day]: prev.perDayTimeSlots[day].filter(
              (slot: { id: string }) => slot.id !== id,
            ),
          },
        };
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-8 shadow-md">
        <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold text-blue-700">
          <span>Working Days</span>
          <span className="text-base text-red-500">*</span>
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Select the days you are available to provide services.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {allDays.map((day) => (
            <label
              key={day}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:bg-blue-100"
            >
              <input
                type="checkbox"
                checked={formData.availabilitySchedule.includes(day)}
                onChange={() => handleDayToggle(day)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">{day}</span>
            </label>
          ))}
        </div>
        {validationErrors.availabilitySchedule && (
          <p className="mt-2 text-sm text-red-600">
            {validationErrors.availabilitySchedule}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-8 shadow-md">
        <h2 className="mb-2 text-2xl font-bold text-blue-700">Working Hours</h2>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="useSameTimeForAllDays"
            checked={formData.useSameTimeForAllDays}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                useSameTimeForAllDays: e.target.checked,
              }))
            }
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="useSameTimeForAllDays"
            className="ml-2 text-base font-medium text-gray-700"
          >
            Use the same working hours for all selected days
          </label>
        </div>

        {formData.useSameTimeForAllDays ? (
          <div className="space-y-2">
            {formData.commonTimeSlots.map((slot) => (
              <TimeSlotInput
                key={slot.id}
                slot={slot}
                onSlotChange={(id, field, value) =>
                  handleTimeSlotChange("common", id, field, value)
                }
                onRemoveSlot={(id) => removeTimeSlot("common", id)}
              />
            ))}
            <button
              type="button"
              onClick={() => addTimeSlot("common")}
              className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              + Add Time Slot
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {formData.availabilitySchedule.map((day) => (
              <div
                key={day}
                className="flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
              >
                <h4 className="mb-2 font-semibold text-blue-700">{day}</h4>
                <div className="flex flex-col gap-2">
                  {(formData.perDayTimeSlots[day] || []).map((slot) => (
                    <TimeSlotInput
                      key={slot.id}
                      slot={slot}
                      onSlotChange={(id, field, value) =>
                        handleTimeSlotChange(day, id, field, value)
                      }
                      onRemoveSlot={(id) => removeTimeSlot(day, id)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addTimeSlot(day)}
                  className="mt-2 self-end text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Add Time Slot
                </button>
              </div>
            ))}
          </div>
        )}
        {validationErrors.timeSlots && (
          <p className="mt-4 text-sm text-red-600">
            {validationErrors.timeSlots}
          </p>
        )}
      </section>
    </div>
  );
};

export default ServiceAvailability;
