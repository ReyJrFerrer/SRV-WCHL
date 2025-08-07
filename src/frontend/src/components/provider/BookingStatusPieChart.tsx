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

const PLACEHOLDER_COLOR = "#E0E0E0"; // A light gray color for the placeholder
const placeholderData = [{ name: "No Data", value: 100 }];

const BookingStatusPieChart: React.FC = () => {
  const { analytics, loadingAnalytics } = useProviderBookingManagement();

  // If the data is still loading, display a loading message.
  if (loadingAnalytics) {
    return <div>Chart is loading...</div>;
  }

  // Check if there is no analytics data at all.
  const hasAnalyticsData =
    analytics &&
    (analytics.acceptedBookings > 0 ||
      analytics.completedBookings > 0 ||
      analytics.pendingRequests > 0 ||
      analytics.cancelledBookings > 0 ||
      analytics.disputedBookings > 0);

  // --- Start of the updated placeholder logic ---
  if (!hasAnalyticsData) {
    return (
      <div style={{ width: "100%", height: 275 }}>
        <h3 className="text-lg font-semibold text-gray-800">Booking Status</h3>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={placeholderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill={PLACEHOLDER_COLOR}
                dataKey="value"
              >
                <Cell key={`cell-placeholder`} fill={PLACEHOLDER_COLOR} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              position: "absolute",
              textAlign: "center",
              width: "80%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#888",
            }}
          >
            Add your first service and be booked to see analytics.
          </div>
        </div>
      </div>
    );
  }
  // --- End of the updated placeholder logic ---

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