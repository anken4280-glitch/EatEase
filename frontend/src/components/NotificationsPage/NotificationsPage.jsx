import React, { useState, useEffect } from "react";
import "./NotificationsPage.css";
import ReservationModal from "../ReservationModal/ReservationModal";

function NotificationsPage({ user, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBookNow = async (notification) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurants/${notification.restaurant_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const restaurant = data.restaurant || data;

        // Set restaurant and show modal
        setSelectedRestaurant(restaurant);
        setShowReservationModal(true);
      }
    } catch (error) {
      console.error("Error fetching restaurant for booking:", error);
      alert("Could not load restaurant details. Please try again.");
    }
  };

  const handleSnoozeNotification = async (notificationId) => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/notifications/${notificationId}/snooze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        alert("Notification snoozed for 1 hour");
        fetchNotifications(); // Refresh list
      }
    } catch (error) {
      console.error("Error snoozing notification:", error);
    }
  };

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
        },
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
        <button className="bookmarks-back-button" onClick={onBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="black"
          >
            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
          </svg>
        </button>
        <h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="Gray"
          >
            <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
          </svg>{" "}
          My Notifications
        </h1>
      </div>

      {loading && (
        <div className="loading-state">
          <p>Loading notifications</p>
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
            <div className="notifications-empty-state">
              <div className="empty-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="40px"
                  viewBox="0 -960 960 960"
                  width="40px"
                  fill="black"
                >
                  <path d="M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 100q-68 0-123.5 38.5T276-280h66q22-37 58.5-58.5T480-360q43 0 79.5 21.5T618-280h66q-25-63-80.5-101.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
                </svg>
              </div>
              <h3>No notifications set</h3>
              <p>
                Set notifications to get alerts when restaurants reach certain
                crowd levels
              </p>
            </div>
          ) : (
            <div className="notifications-container">
              <p className="notifications-count">
                {notifications.length} notification/s set
              </p>

              <div className="notifications-list">
                {notifications.map((notification) => {
                  // Determine if this is a crowd alert notification
                  const isCrowdAlert =
                    notification.type === "crowd_alert" ||
                    notification.message?.includes("crowd") ||
                    notification.notify_when_status;

                  return (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-info">
                        <h3>
                          {notification.restaurant_name || "Unknown Restaurant"}
                        </h3>

                        {isCrowdAlert ? (
                          <div className="crowd-alert-notification">
                            <div className="alert-message">
                              <span className="alert-icon">👥</span>
                              <span className="message-text">
                                {notification.message ||
                                  `Notify when crowd is ${getStatusText(notification.notify_when_status)}`}
                              </span>
                            </div>

                            {/* ADD THIS ACTION BUTTONS SECTION */}
                            <div className="notification-actions-row">
                              <button
                                className="action-btn book-now-btn"
                                onClick={() => {
                                  // We'll implement this function
                                  handleBookNow(notification);
                                }}
                              >
                                <span role="img" aria-label="plate">
                                  🍽️
                                </span>{" "}
                                Book Now
                              </button>

                              <button
                                className="action-btn snooze-btn"
                                onClick={() =>
                                  handleSnoozeNotification(notification.id)
                                }
                              >
                                <span role="img" aria-label="clock">
                                  ⏰
                                </span>{" "}
                                Snooze 1hr
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="notification-setting">
                            <span className="setting-label">
                              Notify me when:
                            </span>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: getStatusColor(
                                  notification.notify_when_status,
                                ),
                              }}
                            >
                              {getStatusText(notification.notify_when_status)}
                            </span>
                          </div>
                        )}

                        {notification.cuisine && (
                          <p className="cuisine">{notification.cuisine}</p>
                        )}
                        {notification.address &&
                          notification.address !== "Address not available" && (
                            <p className="address">{notification.address}</p>
                          )}
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
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {/* Reservation Modal */}
      {showReservationModal && selectedRestaurant && (
        <ReservationModal
          restaurant={selectedRestaurant}
          onClose={() => {
            setShowReservationModal(false);
            setSelectedRestaurant(null);
          }}
          onSuccess={(reservation) => {
            alert(
              `✅ Reservation confirmed! Code: ${reservation.confirmation_code}`,
            );
            // Optionally mark notification as acted upon
            setShowReservationModal(false);
            setSelectedRestaurant(null);
          }}
        />
      )}
    </div>
  );
}

export default NotificationsPage;
