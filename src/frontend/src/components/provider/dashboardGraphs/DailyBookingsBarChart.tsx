import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useProviderBookingManagement } from "../../../hooks/useProviderBookingManagement";

const DailyBookingsBarChart: React.FC = () => {
  const { getBookingCountByDay, loading } = useProviderBookingManagement();
  const data = getBookingCountByDay();

  if (loading) {
    return <div>Loading chart...</div>;
  }

  // Custom formatter for the X-Axis ticks to shorten day names
  const formatDayName = (name: string) => {
    return name.substring(0, 3); // Shortens "Sunday" to "Sun", "Monday" to "Mon", etc.
  };

  return (
    <div style={{ width: "100%", height: 300 }}>
      <h3 className="text-lg font-semibold text-gray-800">
        Bookings by Day of the Week
      </h3>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tickFormatter={formatDayName} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#82ca9d" name="Number of Bookings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyBookingsBarChart;
