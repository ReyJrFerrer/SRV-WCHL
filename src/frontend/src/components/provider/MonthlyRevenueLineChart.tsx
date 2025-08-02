import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useProviderBookingManagement } from '../../hooks/useProviderBookingManagement';

const MonthlyRevenueLineChart: React.FC = () => {
  const { getMonthlyRevenue, analytics, loading } = useProviderBookingManagement();
  const data = getMonthlyRevenue();

  if (loading) {
    return <div>Loading chart...</div>;
  }
  
  // Ensure analytics and totalRevenue are available before using them
  const totalRevenue = analytics?.totalRevenue ?? 0;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 className="text-lg font-semibold text-gray-800">
        Total Revenue: <span className="font-bold">₱{(totalRevenue).toFixed(2)}</span>
      </h3>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyRevenueLineChart;