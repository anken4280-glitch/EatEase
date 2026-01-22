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
      setError("");

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
        // Set actual notifications
        const notificationsList = data.notifications || [];
        setNotifications(notificationsList);

        // Calculate unread count
        const unread = notificationsList.filter((n) => !n.is_read).length;
        setUnreadCount(unread);

        // Keep preferences if needed
        setNotificationPreferences(data.preferences || []);
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

  // Add these new functions to your component:

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Delete this notification?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost:8000/api/user-notifications/${notificationId}`, // NEW ENDPOINT
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
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Update unread count if needed
        if (
          notifications.find((n) => n.id === notificationId)?.is_read === false
        ) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        alert("Notification deleted!");
      } else {
        alert(data.message || "Failed to delete notification");
      }
    } catch (error) {
      console.error("Delete notification error:", error);
      alert("Failed to delete notification");
    }
  };

  const deleteAllNotifications = async () => {
    if (notifications.length === 0) return;

    if (!window.confirm(`Delete all ${notifications.length} notifications?`))
      return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        "http://localhost:8000/api/user-notifications", // NEW ENDPOINT
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
        setNotifications([]);
        setUnreadCount(0);
        alert(
          `All notifications deleted! (${data.deleted_count || notifications.length} removed)`,
        );
      } else {
        alert(data.message || "Failed to delete all notifications");
      }
    } catch (error) {
      console.error("Delete all notifications error:", error);
      alert("Failed to delete all notifications");
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
          {" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="black"
          >
            <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
          </svg>{" "}
          My Notifications
          {unreadCount > 0 && (
            <span className="unread-counter">({unreadCount} new)</span>
          )}
        </h1>

        {/* ADD THIS - Delete All button */}
        {notifications.length > 0 && (
          <button
            className="delete-all-btn"
            onClick={deleteAllNotifications}
            title="Delete all notifications"
          >
            Delete All
          </button>
        )}
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
                            markAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          ✓
                        </button>

                        {/* ADD THIS - Delete button */}
                        <button
                          className="delete-btn"
                          onClick={() => {
                            deleteNotification(notification.id);
                          }}
                          title="Delete notification"
                        >
                          ×
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
