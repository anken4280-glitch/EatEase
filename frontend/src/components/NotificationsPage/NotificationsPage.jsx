import React, { useState, useEffect } from "react";
import "./NotificationsPage.css";

function NotificationsPage({ user, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Please login to view notifications");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.message || "Failed to load notifications");
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNotification = async (notificationId) => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost:8000/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setNotifications(notifications.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Remove notification error:", error);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "green":
        return "Low Crowd";
      case "yellow":
        return "Moderate Crowd";
      case "orange":
        return "Busy";
      case "red":
        return "Very High Crowd";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "green":
        return "#51CF66";
      case "yellow":
        return "#FCC419";
      case "orange":
        return "#FF922B";
      case "red":
        return "#FF6B6B";
      default:
        return "#666";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>🔔 My Notifications</h1>
      </div>

      {loading && (
        <div className="loading-state">
          <p>Loading notifications...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchNotifications}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <h3>No notifications set</h3>
              <p>
                Set notifications to get alerts when restaurants reach certain
                crowd levels
              </p>
            </div>
          ) : (
            <div className="notifications-container">
              <p className="notifications-count">
                {notifications.length} notification(s) set
              </p>

              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className="notification-item">
                    <div className="notification-info">
                      <h3>{notification.restaurant_name}</h3>
                      <div className="notification-setting">
                        <span className="setting-label">Notify me when:</span>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(
                              notification.notify_when_status
                            ),
                          }}
                        >
                          {getStatusText(notification.notify_when_status)}
                        </span>
                      </div>
                      <p className="cuisine">{notification.cuisine}</p>
                      <p className="address">{notification.address}</p>
                      <p className="set-date">
                        Set on {formatDate(notification.created_at)}
                      </p>
                    </div>

                    <div className="notification-actions">
                      <button
                        className="remove-btn"
                        onClick={() =>
                          handleRemoveNotification(notification.id)
                        }
                        title="Remove notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NotificationsPage;
