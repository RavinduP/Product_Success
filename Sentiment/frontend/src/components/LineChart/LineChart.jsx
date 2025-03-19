// src/components/LineChart/LineChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineChart = ({ data }) => {
  // Ensure the data is sorted by date in ascending order
  const sortedData = [...data].sort((a, b) => new Date(a.Date) - new Date(b.Date));

  // Chart Data
  const chartData = {
    labels: sortedData.map(item => item.Date), // Sorted Dates
    datasets: [
      {
        label: 'Sentiment',
        data: sortedData.map(item => item.sentiment),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="line-chart">
      {/* <h3>Sentiment over Time</h3> */}
      <Line data={chartData} />
    </div>
  );
};

export default LineChart;
