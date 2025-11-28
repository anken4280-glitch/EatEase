import React from "react";
import './PopularTimesChart.css';

export default function PopularTimesChart({ restaurant, currentTime }) {
  // Sample popular times data (in a real app, this would come from IoT sensors)
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
    { hour: "10PM", crowd: 30, label: "Late Night" }
  ];

  const getCurrentHourIndex = () => {
    const hour = currentTime.getHours();
    if (hour < 8) return 0;
    if (hour > 22) return 14;
    return hour - 8;
  };

  const currentHourIndex = getCurrentHourIndex();
  const currentCrowdLevel = popularTimes[currentHourIndex]?.crowd || 0;

  const getCrowdLevelColor = (crowd) => {
    if (crowd <= 30) return "var(--success)";
    if (crowd <= 70) return "var(--warning)";
    return "var(--danger)";
  };

  const getCrowdLevelLabel = (crowd) => {
    if (crowd <= 30) return "Quiet";
    if (crowd <= 70) return "Moderate";
    return "Busy";
  };

  return (
    <div className="popular-times-chart">
      <div className="chart-header">
        <h4>📊 Popular Times</h4>
        <div className="current-crowd">
          <span className="label">Right now:</span>
          <span 
            className="crowd-level" 
            style={{ color: getCrowdLevelColor(currentCrowdLevel) }}
          >
            {getCrowdLevelLabel(currentCrowdLevel)} ({currentCrowdLevel}%)
          </span>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-bars">
          {popularTimes.map((time, index) => (
            <div key={index} className="chart-bar-container">
              <div className="time-label">{time.hour}</div>
              <div 
                className={`chart-bar ${index === currentHourIndex ? 'current-hour' : ''}`}
                style={{ 
                  height: `${time.crowd}%`,
                  backgroundColor: getCrowdLevelColor(time.crowd)
                }}
                title={`${time.hour}: ${time.crowd}% busy - ${time.label}`}
              >
                <span className="crowd-percent">{time.crowd}%</span>
              </div>
              <div className="period-label">{time.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="color-dot" style={{ backgroundColor: "var(--success)" }}></div>
          <span>Quiet (0-30%)</span>
        </div>
        <div className="legend-item">
          <div className="color-dot" style={{ backgroundColor: "var(--warning)" }}></div>
          <span>Moderate (31-70%)</span>
        </div>
        <div className="legend-item">
          <div className="color-dot" style={{ backgroundColor: "var(--danger)" }}></div>
          <span>Busy (71-100%)</span>
        </div>
      </div>

      <div className="chart-insights">
        <h5>💡 Best Times to Visit:</h5>
        <ul>
          <li>🕗 Early Breakfast (8AM-10AM): Least crowded</li>
          <li>🕒 Afternoon (2PM-4PM): Good balance</li>
          <li>🕤 Late Night (9PM+): Winding down</li>
        </ul>
        <p className="iot-note">
          <small>📡 Data powered by IoT sensors and historical patterns</small>
        </p>
      </div>
    </div>
  );
}