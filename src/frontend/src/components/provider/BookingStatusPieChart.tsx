import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useProviderBookingManagement } from "../../hooks/useProviderBookingManagement";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF5733",
];

const BookingStatusPieChart: React.FC = () => {
  const { analytics, loadingAnalytics } = useProviderBookingManagement();

  if (loadingAnalytics || !analytics) {
    return <div>Add a service and be booked...</div>;
  }

  const data = [
    { name: "Accepted", value: analytics.acceptedBookings },
    { name: "Completed", value: analytics.completedBookings },
    { name: "Pending", value: analytics.pendingRequests },
    { name: "Cancelled", value: analytics.cancelledBookings },
    { name: "Disputed", value: analytics.disputedBookings },
  ];

  return (
    <div style={{ width: "100%", height: 275 }}>
      <h3 className="text-lg font-semibold text-gray-800">Booking Status</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BookingStatusPieChart;
