import React, { useState, useEffect } from "react";
import "./NotificationsPage.css";
import ReservationModal from "../ReservationModal/ReservationModal";

function NotificationsPage({ user, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantCurrentStatus, setRestaurantCurrentStatus] = useState({}); // Track restaurant current status
  const [notificationPreferences, setNotificationPreferences] = useState([]); // ADD THIS LINE
  // Add this with other state variables:
  const [unreadCount, setUnreadCount] = useState(0);

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

      // Use the new endpoint for actual notifications
      const response = await fetch(
        "http://localhost:8000/api/user-notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log("Actual notifications:", data.notifications);
        console.log("Notification preferences:", data.preferences);

        // Set both arrays
        setNotifications(data.notifications || []);
        setNotificationPreferences(data.preferences || []); // This line was missing
        // Calculate unread count
        const unread = (data.notifications || []).filter(
          (n) => !n.is_read,
        ).length;
        setUnreadCount(unread);
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

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:8000/api/notifications/${notificationId}/mark-read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n,
          ),
        );
        // Decrease unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  useEffect(() => {
    if (notifications.length > 0) {
      fetchRestaurantsCurrentStatus();
    }
  }, [notifications]);

  const fetchRestaurantsCurrentStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const statusMap = {};

      // Fetch current status for each restaurant in notifications
      for (const notification of notifications) {
        if (notification.restaurant_id) {
          try {
            const response = await fetch(
              `http://localhost:8000/api/restaurants/${notification.restaurant_id}`,
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
              statusMap[notification.restaurant_id] =
                restaurant.crowd_level || "unknown";
            }
          } catch (err) {
            console.error(
              `Error fetching restaurant ${notification.restaurant_id}:`,
              err,
            );
            statusMap[notification.restaurant_id] = "unknown";
          }
        }
      }

      setRestaurantCurrentStatus(statusMap);
    } catch (error) {
      console.error("Error fetching restaurant statuses:", error);
    }
  };

  const shouldShowBookNow = (notification) => {
    const currentStatus = restaurantCurrentStatus[notification.restaurant_id];
    const preferredStatus = notification.notify_when_status;

    // Map statuses to values for comparison
    const statusPriority = {
      green: 0, // Low crowd
      yellow: 1, // Moderate
      orange: 2, // Busy
      red: 3, // Very High
      unknown: -1,
    };

    // If we don't know current status, don't show button
    if (!currentStatus || currentStatus === "unknown") {
      return false;
    }

    // Show Book Now if current crowd is EQUAL TO or BETTER THAN preferred
    // (e.g., if user wants "low", show when it's low OR even lower)
    const currentPriority = statusPriority[currentStatus] || -1;
    const preferredPriority = statusPriority[preferredStatus] || -1;

    // For crowd level notifications: lower number = better (less crowded)
    // Show button when current crowd is <= preferred crowd level
    return currentPriority <= preferredPriority;
  };

  const handleBookNow = async (notification) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost:8000/api/restaurants/${notification.restaurant_id}`,
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
        `http://localhost:8000/api/notifications/${notificationId}/snooze`, // ✅ FIXED
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
          {/* SHOW ACTUAL NOTIFICATIONS */}
          {notifications.length === 0 ? (
            <div className="notifications-empty-state">
              <div className="empty-icon">📭</div>
              <h3>No notifications yet</h3>
              <p>
                You'll get alerts here when restaurants reach your preferred
                crowd levels
              </p>
            </div>
          ) : (
            <div className="notifications-container">
              <p className="notifications-count">
                {notifications.length} notification
                {notifications.length !== 1 ? "s" : ""}
              </p>

              <div className="notifications-list">
                {notifications.map((notification) => {
                  // Determine if this is a crowd alert
                  const isCrowdAlert =
                    notification.type === "crowd_alert" ||
                    notification.notification_type === "crowd_alert";

                  return (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-info">
                        <h3>
                          {notification.restaurant_name || "Unknown Restaurant"}
                          {notification.is_read === false && (
                            <span className="unread-badge">NEW</span>
                          )}
                        </h3>

                        <div className="notification-message">
                          <p>{notification.message}</p>
                        </div>

                        <div className="notification-details">
                          <span className="notification-type">
                            {isCrowdAlert
                              ? "👥 Crowd Alert"
                              : "📢 Notification"}
                          </span>
                          <span
                            className={`status-badge status-${notification.status}`}
                          >
                            {getStatusText(notification.status)}
                          </span>
                          <span className="notification-time">
                            {formatDate(
                              notification.sent_at || notification.created_at,
                            )}
                          </span>
                        </div>

                        {/* "Book Now" button - show for crowd alerts */}
                        {isCrowdAlert && (
                          <button
                            className="action-btn book-now-btn"
                            onClick={() => {
                              // You'll need to implement handleBookNow
                              handleBookNow(notification);
                            }}
                          >
                            <span role="img" aria-label="plate">
                              🍽️
                            </span>{" "}
                            Book Now
                          </button>
                        )}
                      </div>

                      <div className="notification-actions">
                        <button
                          className="remove-btn"
                          onClick={() => {
                            // You might want to mark as read instead of remove
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          ✓
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

// Helper functions
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
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default NotificationsPage;
