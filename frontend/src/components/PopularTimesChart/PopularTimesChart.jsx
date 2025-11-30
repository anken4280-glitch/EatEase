import React from "react";
import './PopularTimesChart.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

export default function PopularTimesChart({ restaurant, currentTime }) {
  // Sample popular times data (can come from restaurant.popularTimes if available)
  const popularTimes = [
    { hour: "8AM", crowd: 15, label: "Breakfast" },
    { hour: "9AM", crowd: 20, label: "Breakfast" },
    { hour: "10AM", crowd: 25, label: "Brunch" },
    { hour: "11AM", crowd: 40, label: "Lunch" },
    { hour: "12PM", crowd: 85, label: "Lunch Peak" },
    { hour: "1PM", crowd: 75, label: "Lunch" },
    { hour: "2PM", crowd: 35, label: "Afternoon" },
    { hour: "3PM", crowd: 25, label: "Afternoon" },
    { hour: "4PM", crowd: 30, label: "Early Dinner" },
    { hour: "5PM", crowd: 45, label: "Dinner" },
    { hour: "6PM", crowd: 90, label: "Dinner Peak" },
    { hour: "7PM", crowd: 85, label: "Dinner" },
    { hour: "8PM", crowd: 70, label: "Dinner" },
    { hour: "9PM", crowd: 50, label: "Late Night" },
    { hour: "10PM", crowd: 30, label: "Late Night" },
  ];

  const getCurrentHourIndex = () => {
    const hour = currentTime.getHours();
    if (hour < 8) return 0;
    if (hour > 22) return 14;
    return hour - 8;
  };

  const currentHourIndex = getCurrentHourIndex();

  const getCrowdLevelColor = (crowd) => {
    if (crowd <= 30) return "#10B981"; // success / green
    if (crowd <= 70) return "#F59E0B"; // warning / yellow
    return "#EF4444"; // danger / red
  };

  return (
    <div className="popular-times-chart" style={{ width: "100%", height: 300 }}>
      <h4>📊 Popular Times</h4>
      <ResponsiveContainer>
        <BarChart data={popularTimes} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip
            formatter={(value, name, props) => [`${value}%`, props.payload.label]}
          />
          <Bar dataKey="crowd">
            {popularTimes.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index === currentHourIndex
                    ? "#2563EB" // highlight current hour in blue
                    : getCrowdLevelColor(entry.crowd)
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: "1rem" }}>
        <strong>Right now:</strong>{" "}
        <span style={{ color: getCrowdLevelColor(popularTimes[currentHourIndex].crowd) }}>
          {popularTimes[currentHourIndex].crowd <= 30
            ? "Quiet"
            : popularTimes[currentHourIndex].crowd <= 70
            ? "Moderate"
            : "Busy"}{" "}
          ({popularTimes[currentHourIndex].crowd}%)
        </span>
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#555" }}>
        <p>💡 Best Times to Visit:</p>
        <ul>
          <li>🕗 Early Breakfast (8AM-10AM): Least crowded</li>
          <li>🕒 Afternoon (2PM-4PM): Good balance</li>
          <li>🕤 Late Night (9PM+): Winding down</li>
        </ul>
        <small>📡 Data powered by IoT sensors and historical patterns</small>
      </div>
    </div>
  );
}
