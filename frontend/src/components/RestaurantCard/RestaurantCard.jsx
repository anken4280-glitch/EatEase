import React, { useState, useEffect } from "react";
import "./RestaurantCard.css";
import TierBadge from "../TierBadge/TierBadge";

function RestaurantCard({ 
  restaurant, 
  onRestaurantClick,
  allNotifications = [] // ADD THIS PROP
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userHasNotification, setUserHasNotification] = useState(null);

  // Find notification from parent's pre-fetched data
  useEffect(() => {
    const notification = allNotifications.find(
      n => n.restaurant_id === restaurant.id
    );
    setUserHasNotification(notification?.notify_when_status || null);
  }, [allNotifications, restaurant.id]);

  // Keep bookmark check but remove notification fetch
  useEffect(() => {
    checkBookmarks();
  }, [restaurant.id]);

  const checkBookmarks = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      // Check bookmarks only
      const bookmarksRes = await fetch("http://localhost:8000/api/bookmarks", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (bookmarksRes.ok) {
        const bookmarksData = await bookmarksRes.json();
        if (bookmarksData.success && bookmarksData.bookmarks) {
          const bookmarked = bookmarksData.bookmarks.some(
            (b) => b.restaurant_id === restaurant.id
          );
          setIsBookmarked(bookmarked);
        }
      }
    } catch (error) {
      console.error("Error checking bookmarks:", error);
    }
  };

  const handleClick = () => {
    onRestaurantClick(restaurant);
  };

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    setLoading(true);

    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Please login to bookmark restaurants");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/bookmarks/${restaurant.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsBookmarked(data.isBookmarked);
        // Optional: Show subtle feedback
        console.log(data.message);
      } else {
        console.error("Bookmark failed:", data.message);
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      alert("Failed to update bookmark. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("auth_token");

    if (!token) {
      alert("Please login to set notifications");
      return;
    }

    setShowNotificationModal(true);
  };

  const handleSetNotification = async (crowdLevel) => {
    const token = localStorage.getItem("auth_token");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/notifications/${restaurant.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ notify_when_status: crowdLevel }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setUserHasNotification(crowdLevel);

        // TRIGGER GLOBAL REFRESH - This will update parent's allNotifications
        if (window.refreshNotificationCount) {
          window.refreshNotificationCount();
        }

        alert(
          `You'll be notified when ${restaurant.name} has ${getStatusText(
            crowdLevel
          )} crowd!`
        );
        setShowNotificationModal(false);
      } else {
        alert(
          "Failed to set notification: " + (data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Notification error:", error);
      alert("Failed to set notification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNotification = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setLoading(true);
    try {
      // Since we have allNotifications from parent, find the ID
      const notification = allNotifications.find(
        n => n.restaurant_id === restaurant.id
      );

      if (notification) {
        const deleteRes = await fetch(
          `http://localhost:8000/api/notifications/${notification.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const deleteData = await deleteRes.json();
        if (deleteData.success) {
          setUserHasNotification(null);

          // TRIGGER GLOBAL REFRESH
          if (window.refreshNotificationCount) {
            window.refreshNotificationCount();
          }

          alert("Notification removed");
        }
      }
    } catch (error) {
      console.error("Remove notification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "green":
        return "Low";
      case "yellow":
        return "Moderate";
      case "orange":
        return "Busy";
      case "red":
        return "Very High";
      default:
        return status;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case "green":
        return " Get a table easily";
      case "yellow":
        return " Consider going soon";
      case "orange":
        return " Some wait time";
      case "red":
        return " Long wait expected";
      default:
        return "";
    }
  };

  const shortAddress = restaurant.address
    ? restaurant.address.split(",")[0].trim()
    : "Location not available";

  return (
    <>
      <div className="restaurant-card" onClick={handleClick}>
        <div className="card-header">
          <div className="card-title-section">
            <div className="restaurant-title-row">
              <div className="restaurant-name-and-tier">
                <h3 className="restaurant-name">{restaurant.name}</h3>
                <TierBadge restaurantData={restaurant} />
              </div>

              <div className="rating-display">
                {restaurant.average_rating > 0 ? (
                  <div className="star-rating-small">
                    <div className="stars-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${
                            star <= Math.round(restaurant.average_rating)
                              ? "filled"
                              : ""
                          }`}
                          style={{
                            color:
                              star <= Math.round(restaurant.average_rating)
                                ? "#FFD700"
                                : "#ddd",
                            fontSize: "14px",
                          }}
                        >
                          {star <= Math.round(restaurant.average_rating)
                            ? "★"
                            : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-rating">No reviews yet</div>
                )}
              </div>
            </div>
          </div>

          <div className={`status-badge ${restaurant.status}`}>
            {restaurant.crowdLevel}
          </div>
        </div>

        <div className="card-details">
          <p className="cuisine">
            <svg
              width="16"
              height="16"
              viewBox="0 -960 960 960"
              fill="orange"
              aria-hidden="true"
            >
              <path d="m175-120-56-56 410-410q-18-42-5-95t57-95q53-53 118-62t106 32q41 41 32 106t-62 118q-42 44-95 57t-95-5l-50 50 304 304-56 56-304-302-304 302Z" />
            </svg>
            Cuisine: {restaurant.cuisine}
          </p>
          <p className="occupancy">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16"
              viewBox="0 -960 960 960"
              width="16"
              fill="red"
              aria-hidden="true"
            >
              <path d="M480-660q-29 0-49.5-20.5T410-730q0-29 20.5-49.5T480-800q29 0 49.5 20.5T550-730q0 29-20.5 49.5T480-660Zm-80 500v-200h-40v-180q0-33 23.5-56.5T440-620h80q33 0 56.5 23.5T600-540v180h-40v200H400Z" />
            </svg>
            Occupancy: {restaurant.occupancy}%
          </p>

          <div className="location-container">
            <svg
              className="location-icon"
              width="16"
              height="16"
              viewBox="0 -960 960 960"
              fill="currentColor"
              aria-hidden="true"
              color="red"
            >
              <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
            </svg>
            <span className="location-text">{shortAddress}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card-actions">
          <button
            className={`bookmark-btn ${isBookmarked ? "active" : ""} ${
              loading ? "loading" : ""
            }`}
            onClick={handleBookmarkClick}
            disabled={loading}
            aria-label={
              isBookmarked ? "Remove bookmark" : "Bookmark restaurant"
            }
          >
            {loading ? "..." : isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>

          <button
            className={`notification-btn ${
              userHasNotification ? "active" : ""
            } ${loading ? "loading" : ""}`}
            onClick={handleNotificationClick}
            disabled={loading}
            aria-label={
              userHasNotification ? "Change notification" : "Set notification"
            }
          >
            {loading ? (
              "..."
            ) : userHasNotification ? (
              <>
                <svg
                  className="notification-icon"
                  width="16"
                  height="14"
                  viewBox="0 -960 960 960"
                  fill="currentColor"
                >
                  <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
                </svg>
                {getStatusText(userHasNotification)}
              </>
            ) : (
              <>
                <svg
                  className="notification-icon"
                  width="16"
                  height="14"
                  viewBox="0 -960 960 960"
                  fill="currentColor"
                >
                  <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
                </svg>
                Notify Me
              </>
            )}
          </button>
        </div>

        {/* Show current notification setting */}
        {userHasNotification && (
          <div className="current-notification">
            <small>
              You'll be notified at:{" "}
              <span className={`status-${userHasNotification}`}>
                {getStatusText(userHasNotification)}
              </span>
            </small>
            <button
              className="remove-notification-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveNotification();
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div
          className="notification-modal-overlay"
          onClick={() => setShowNotificationModal(false)}
        >
          <div
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Notify me when {restaurant.name} is:</h4>

            <div className="notification-options">
              {["green", "yellow", "orange", "red"].map((status) => (
                <button
                  key={status}
                  className={`notification-option ${status} ${
                    userHasNotification === status ? "selected" : ""
                  }`}
                  onClick={() => handleSetNotification(status)}
                  disabled={loading}
                >
                  <div className="status-indicator-wrapper">
                    <div className={`status-indicator ${status}`}></div>
                    {userHasNotification === status && (
                      <div className="selected-check">✓</div>
                    )}
                  </div>
                  <div className="option-text">
                    <span className="option-title">
                      {getStatusText(status)} Crowd
                    </span>
                    <small className="option-desc">
                      {getStatusDescription(status)}
                    </small>
                  </div>
                </button>
              ))}
            </div>

            {userHasNotification && (
              <button
                className="remove-all-btn"
                onClick={handleRemoveNotification}
                disabled={loading}
              >
                Remove My Notification
              </button>
            )}

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowNotificationModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RestaurantCard;
