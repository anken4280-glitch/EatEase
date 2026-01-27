import React, { useState, useEffect } from "react";
import "./AnalyticsTab.css";

const AnalyticsTab = ({ restaurantId, isPremium }) => {
  if (!restaurantId) {
    return (
      <div className="error-message">Error: No restaurant ID provided</div>
    );
  }

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost/EatEase-Backend/backend/public/api/restaurants/${restaurantId}/analytics?range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      console.log("Analytics API Response Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Analytics API Data:", data);

        if (data.success && data.analytics) {
          setAnalyticsData(data.analytics);
        } else {
          setAnalyticsData(null);
        }
      } else {
        console.warn("API returned non-OK status");
        setAnalyticsData(null);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium && restaurantId) {
      fetchAnalytics();
    }
  }, [restaurantId, isPremium, timeRange]);

  // If not premium, show upgrade prompt
  if (!isPremium) {
    return (
      <div className="analytics-premium-locked">
        <div className="premium-locked-content">
          <div className="premium-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="80px"
              viewBox="0 -960 960 960"
              width="80px"
              fill="gray"
            >
              <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" />
            </svg>
          </div>
          <h3>Premium Analytics Locked</h3>
          <p>
            Upgrade to Premium tier to access detailed analytics and insights
            about your restaurant performance.
          </p>

          <div className="premium-features-list">
            <div className="feature-item">
              <span className="feature-text">Advanced occupancy analytics</span>
            </div>
            <div className="feature-item">
              <span className="feature-text">Customer demographics</span>
            </div>
            <div className="feature-item">
              <span className="feature-text">Peak hour analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-text">Revenue estimation</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Check if we have data
  const hasData = analyticsData?.occupancy?.has_data || false;

  if (!hasData) {
    return (
      <div className="analytics-empty-state">
        <div className="empty-icon">📊</div>
        <h3>No Analytics Data Yet</h3>
        <p>
          Your analytics dashboard will show occupancy trends, peak hours,
          and customer patterns once you start updating your restaurant's occupancy.
        </p>
        <div className="empty-tips">
          <p><strong>To get started:</strong></p>
          <ol>
            <li>Go to the <strong>Overview</strong> tab</li>
            <li>Click <strong>Edit Profile</strong> in the menu</li>
            <li>Update your current occupancy</li>
            <li>Return here to see your analytics!</li>
          </ol>
        </div>
        <p className="empty-note">
          Analytics data is automatically collected when you update your restaurant's occupancy.
        </p>
      </div>
    );
  }

  // Extract data safely
  const occupancyData = analyticsData?.occupancy || {};
  const dailyOccupancy = occupancyData.daily || [];
  const weeklyOccupancy = occupancyData.weekly || [];
  const monthlyOccupancy = occupancyData.monthly || [];
  
  const currentOccupancyData = 
    timeRange === "week" ? dailyOccupancy :
    timeRange === "month" ? weeklyOccupancy :
    monthlyOccupancy;

  const peakHours = analyticsData?.peakHours || [];
  const revenueData = analyticsData?.revenue || {};
  const reviewsData = analyticsData?.reviews || {};
  const customersData = analyticsData?.customers || {};
  const summaryData = analyticsData?.summary || {};

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
          <div className="kpi-content">
            <h3>{occupancyData.average || 0}%</h3>
            <p>Average Occupancy</p>
            <div className="kpi-comparison">
              <span>Peak: {occupancyData.peak || 0}%</span>
              <span>Low: {occupancyData.low || 0}%</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-content">
            <h3>{reviewsData.average || 0}</h3>
            <p>Average Rating</p>
            <span className={`kpi-trend ${(reviewsData.trend || 0) > 0 ? 'positive' : 'negative'}`}>
              {(reviewsData.trend || 0) > 0 ? '+' : ''}{reviewsData.trend || 0} reviews
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Occupancy Trend</h3>
          <div className="simple-chart">
            {currentOccupancyData.length > 0 ? (
              currentOccupancyData.map((value, index) => (
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
                        : [
                            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                          ][index] || `Month ${index + 1}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="no-chart-data">
                <p>No occupancy data for this period</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Peak Hours</h3>
          <div className="peak-hours-list">
            {peakHours.length > 0 ? (
              peakHours.map((peak, index) => (
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
              ))
            ) : (
              <div className="no-peak-data">
                <p>No peak hour data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="insights-section">
        <div className="insights-card">
          <h3>Insights</h3>
          <div className="insights-content">
            <div className="best-day">
              <strong>Busiest Day:</strong> {summaryData.best_day || 'No data yet'}
            </div>
          </div>
        </div>

        <div className="customer-card">
          <h3>Customer Analysis</h3>
          <div className="customer-content">
            <div className="customer-metric">
              <div className="metric-value">{customersData.total || 0}</div>
              <div className="metric-label">Total Customers</div>
            </div>
            <div className="customer-breakdown">
              <div className="breakdown-item repeat">
                <div className="breakdown-percent">{customersData.repeat || 0}%</div>
                <div className="breakdown-label">Repeat</div>
              </div>
              <div className="breakdown-item new">
                <div className="breakdown-percent">{customersData.new || 0}%</div>
                <div className="breakdown-label">New</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Info */}
      <div className="data-info">
        <p>
          <small>
            Analytics based on {occupancyData.total_logs || 0} occupancy logs. 
            Data updates automatically when you update your restaurant occupancy.
          </small>
        </p>
      </div>
    </div>
  );
};

export default AnalyticsTab;