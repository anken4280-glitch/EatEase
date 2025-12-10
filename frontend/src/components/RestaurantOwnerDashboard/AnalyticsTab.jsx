import React, { useState, useEffect } from "react";
import "./AnalyticsTab.css";

// Move the mock data function OUTSIDE the component
const getMockAnalyticsData = () => {
  return {
    occupancy: {
      daily: [65, 70, 45, 80, 90, 75, 60],
      weekly: [70, 65, 80, 75, 85, 90, 70],
      monthly: [65, 70, 75, 80, 85, 90, 85, 80, 75, 70, 65, 60],
    },
    peakHours: [
      { hour: "12 PM", occupancy: 90 },
      { hour: "1 PM", occupancy: 85 },
      { hour: "7 PM", occupancy: 95 },
      { hour: "8 PM", occupancy: 88 },
    ],
    revenue: {
      current: 125000,
      previous: 110000,
      growth: "+13.6%",
    },
    reviews: {
      average: 4.2,
      total: 47,
      trend: "+8",
    },
    customers: {
      repeat: 65,
      new: 35,
    },
  };
};

const AnalyticsTab = ({ restaurantId, isPremium }) => {
  if (!restaurantId) {
    return (
      <div className="error-message">Error: No restaurant ID provided</div>
    );
  }

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week"); // week, month, year

  // Move the fetch function BEFORE using it
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost:8000/api/restaurants/${restaurantId}/analytics?range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Analytics API Response Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Analytics API Data:", data);
        
        // Check if data has the expected structure
        if (data.success && data.analytics) {
          setAnalyticsData(data.analytics);
        } else {
          console.warn("API returned unexpected structure, using mock data");
          setAnalyticsData(getMockAnalyticsData());
        }
      } else {
        console.warn("API returned non-OK status, using mock data");
        setAnalyticsData(getMockAnalyticsData());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsData(getMockAnalyticsData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium && restaurantId) {
      fetchAnalytics();
    }
  }, [restaurantId, isPremium, timeRange]);

  // Calculate safe data AFTER state is initialized
  const safeAnalyticsData = analyticsData || getMockAnalyticsData();
  const occupancyData = safeAnalyticsData?.occupancy || {};
  const dailyOccupancy = occupancyData.daily || [];
  const weeklyOccupancy = occupancyData.weekly || [];
  const monthlyOccupancy = occupancyData.monthly || [];

  const revenueData = safeAnalyticsData?.revenue || {};
  const reviewsData = safeAnalyticsData?.reviews || {};
  const customersData = safeAnalyticsData?.customers || {};
  const peakHours = safeAnalyticsData?.peakHours || [];

  // If not premium, show upgrade prompt
  if (!isPremium) {
    return (
      <div className="analytics-premium-locked">
        <div className="premium-locked-content">
          <div className="premium-icon">🔒</div>
          <h3>Premium Analytics Unlocked</h3>
          <p>
            Upgrade to Premium tier to access detailed analytics and insights
            about your restaurant performance.
          </p>

          <div className="premium-features-list">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">Advanced occupancy analytics</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <span className="feature-text">Revenue projections</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span className="feature-text">Customer demographics</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏰</span>
              <span className="feature-text">Peak hour analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span className="feature-text">ROI calculations</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  // Use safe data instead of mockData
  const currentOccupancyData = timeRange === "week" 
    ? dailyOccupancy 
    : timeRange === "month" 
      ? weeklyOccupancy 
      : monthlyOccupancy;

  const averageRating = reviewsData.average || 0;
  const totalReviews = reviewsData.total || 0;
  const reviewTrend = reviewsData.trend || "+0";
  const currentRevenue = revenueData.current || 0;
  const revenueGrowth = revenueData.growth || "+0%";

  return (
    <div className="analytics-tab">
      <div className="analytics-header">
        <h2>Restaurant Analytics</h2>
        <div className="time-range-selector">
          <button
            className={`time-btn ${timeRange === "week" ? "active" : ""}`}
            onClick={() => setTimeRange("week")}
          >
            Week
          </button>
          <button
            className={`time-btn ${timeRange === "month" ? "active" : ""}`}
            onClick={() => setTimeRange("month")}
          >
            Month
          </button>
          <button
            className={`time-btn ${timeRange === "year" ? "active" : ""}`}
            onClick={() => setTimeRange("year")}
          >
            Year
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>
              {currentOccupancyData.length > 0 
                ? `${(currentOccupancyData.reduce((a, b) => a + b, 0) / currentOccupancyData.length).toFixed(1)}%`
                : '0%'
              }
            </h3>
            <p>Average Occupancy</p>
            <span className="kpi-trend positive">+5% from last week</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>₱{currentRevenue.toLocaleString()}</h3>
            <p>Estimated Monthly Revenue</p>
            <span className="kpi-trend positive">{revenueGrowth}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⭐</div>
          <div className="kpi-content">
            <h3>{averageRating.toFixed(1)}</h3>
            <p>Average Rating</p>
            <span className="kpi-trend positive">{reviewTrend} new reviews</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">🔄</div>
          <div className="kpi-content">
            <h3>{customersData.repeat || 0}%</h3>
            <p>Repeat Customers</p>
            <span className="kpi-trend positive">+12% loyalty</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Occupancy Trend</h3>
          <div className="simple-chart">
            {currentOccupancyData.map((value, index) => (
              <div key={index} className="chart-bar">
                <div
                  className="bar-fill"
                  style={{ height: `${value || 0}%` }}
                  title={`${value || 0}%`}
                ></div>
                <span className="bar-label">
                  {timeRange === "week"
                    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index] || `Day ${index + 1}`
                    : timeRange === "month"
                    ? `Week ${index + 1}`
                    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index] || `Month ${index + 1}`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>Peak Hours</h3>
          <div className="peak-hours-list">
            {peakHours.map((peak, index) => (
              <div key={index} className="peak-hour-item">
                <div className="peak-hour-time">{peak.hour}</div>
                <div className="peak-hour-bar">
                  <div
                    className="peak-bar-fill"
                    style={{ width: `${peak.occupancy || 0}%` }}
                  ></div>
                </div>
                <div className="peak-hour-percent">{peak.occupancy || 0}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h3>📋 Recommendations</h3>
        <div className="recommendations-list">
          <div className="recommendation-card positive">
            <div className="rec-icon">✅</div>
            <div className="rec-content">
              <h4>Great Job!</h4>
              <p>
                Your peak hours (7-8 PM) are highly utilized. Consider extending
                happy hour.
              </p>
            </div>
          </div>
          <div className="recommendation-card warning">
            <div className="rec-icon">⚠️</div>
            <div className="rec-content">
              <h4>Optimize Mid-Day</h4>
              <p>
                2-4 PM shows low occupancy. Consider introducing afternoon
                specials.
              </p>
            </div>
          </div>
          <div className="recommendation-card info">
            <div className="rec-icon">💡</div>
            <div className="rec-content">
              <h4>Revenue Boost</h4>
              <p>
                Implement a loyalty program to increase repeat customers from
                65% to 75%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;