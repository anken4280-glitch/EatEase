import React, { useState, useEffect } from "react";
import "./RestaurantCard.css";
import TierBadge from "../TierBadge/TierBadge";
import pollingService from "../../services/pollingService";

const API_BASE_URL = "http://localhost/EatEase/backend/public";

function RestaurantCard({
  restaurant,
  onRestaurantClick,
  allNotifications = [], // ADD THIS PROP
}) {
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // ✅ CORRECT: Use WAMP URL, not artisan serve URL
    const backendBase = "http://localhost/EatEase/backend/public";

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // The API returns paths like "/storage/restaurant-banners/..."
    // Just prepend the correct backend base URL
    return `${backendBase}${imagePath}`;
  };
  console.log("🚀 Image URL Debug:", {
    original: restaurant.banner_image,
    processed: getImageUrl(restaurant.banner_image),
    backendBase: "http://localhost:8000",
  });

  // ========== IMAGE URLS (MUST BE BEFORE HOOKS) ==========
  const bannerImageUrl = restaurant.banner_image
    ? getImageUrl(restaurant.banner_image)
    : null;

  const profileImageUrl = restaurant.profile_image
    ? getImageUrl(restaurant.profile_image)
    : null;

    // ========== STATE VARIABLES ==========
  const [currentRestaurant, setCurrentRestaurant] = useState(restaurant); // ✅ ADD THIS
  const [isUpdating, setIsUpdating] = useState(false); // ✅ ADD THIS
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userHasNotification, setUserHasNotification] = useState(null);

   // ========== POLLING FOR REAL-TIME UPDATES ========== ✅ ADD THIS SECTION
  useEffect(() => {
    // Subscribe to real-time updates for this restaurant
    const unsubscribe = pollingService.subscribe(
      restaurant.id,
      (updatedData) => {
        console.log(`Real-time update for ${restaurant.name}:`, updatedData);
        
        // Show updating indicator
        setIsUpdating(true);
        
        // Update the restaurant data
        setCurrentRestaurant(prev => ({
          ...prev,
          crowd_status: updatedData.crowd_status,
          current_occupancy: updatedData.current_occupancy,
          occupancy_percentage: updatedData.occupancy_percentage,
          crowdLevel: updatedData.crowd_status === 'green' ? 'Low' :
                    updatedData.crowd_status === 'yellow' ? 'Moderate' :
                    updatedData.crowd_status === 'orange' ? 'Busy' : 'Full'
        }));
        
        // Hide indicator after 1 second
        setTimeout(() => setIsUpdating(false), 1000);
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [restaurant.id, restaurant.name]);

   // ========== EXISTING EFFECTS (UPDATED TO USE currentRestaurant) ==========
  useEffect(() => {
    const notification = allNotifications.find(
      (n) => n.restaurant_id === currentRestaurant.id  // ✅ Use currentRestaurant
    );
    setUserHasNotification(notification?.notify_when_status || null);
  }, [allNotifications, currentRestaurant.id]);  // ✅ Use currentRestaurant.id

  useEffect(() => {
    checkBookmarks();
  }, [currentRestaurant.id]);  // ✅ Use currentRestaurant.id

  const checkBookmarks = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const bookmarksRes = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (bookmarksRes.ok) {
        const bookmarksData = await bookmarksRes.json();
        if (bookmarksData.success && bookmarksData.bookmarks) {
          const bookmarked = bookmarksData.bookmarks.some(
            (b) => b.restaurant_id === currentRestaurant.id  // ✅ Use currentRestaurant
          );
          setIsBookmarked(bookmarked);
        }
      }
    } catch (error) {
      console.error("Error checking bookmarks:", error);
    }
  };

  const handleClick = () => {
    onRestaurantClick(currentRestaurant);  // ✅ Use currentRestaurant
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
        `${API_BASE_URL}/api/bookmarks/${currentRestaurant.id}`,  // ✅ Use currentRestaurant
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setIsBookmarked(data.isBookmarked);
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
        `${API_BASE_URL}/api/notifications/${currentRestaurant.id}`,  // ✅ Use currentRestaurant
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ notify_when_status: crowdLevel }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setUserHasNotification(crowdLevel);

        if (window.refreshNotificationCount) {
          window.refreshNotificationCount();
        }

        alert(
          `You'll be notified when ${currentRestaurant.name} has ${getStatusText(  // ✅ Use currentRestaurant
            crowdLevel,
          )} crowd!`,
        );
        setShowNotificationModal(false);
      } else {
        alert(
          "Failed to set notification: " + (data.message || "Unknown error"),
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
      const notification = allNotifications.find(
        (n) => n.restaurant_id === currentRestaurant.id  // ✅ Use currentRestaurant
      );

      if (notification) {
        const deleteRes = await fetch(
          `${API_BASE_URL}/api/notifications/${notification.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );

        const deleteData = await deleteRes.json();
        if (deleteData.success) {
          setUserHasNotification(null);

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
        return "Full";
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

  const shortAddress = currentRestaurant.address  // ✅ Use currentRestaurant
    ? currentRestaurant.address.split(",")[0].trim()
    : "Location not available";

  // ========== RENDER ==========
  return (
    <>
      <div className="restaurant-card" onClick={handleClick}>
        {/* Banner Container with Update Indicator */}
        <div className="restaurant-banner-container">
          {bannerImageUrl ? (
            <img
              src={bannerImageUrl}
              alt={`${currentRestaurant.name} banner`}
              className="restaurant-banner"
              onError={(e) => {
                console.error("Banner failed to load:", bannerImageUrl);
                e.target.style.display = "none";
                const placeholder = document.createElement("div");
                placeholder.className = "banner-placeholder";
                placeholder.textContent = currentRestaurant.name;
                e.target.parentElement.appendChild(placeholder);
              }}
            />
          ) : (
            <div className="banner-placeholder">{currentRestaurant.name}</div>
          )}

          {/* ✅ UPDATE INDICATOR */}
          {isUpdating && (
            <div className="update-indicator">
              <div className="updating-dot"></div>
              <span>Updating...</span>
            </div>
          )}

          {/* Rating Display */}
          <div className="banner-rating-display">
            <span className="rating-star">★</span>
            <span className="card-rating-number">
              {currentRestaurant.average_rating > 0
                ? Number(currentRestaurant.average_rating).toFixed(1)
                : "0.0"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="banner-action-buttons">
            <button
              className={`bookmark-btn-icon ${isBookmarked ? "active" : ""} ${
                loading ? "loading" : ""
              }`}
              onClick={handleBookmarkClick}
              disabled={loading}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {loading ? (
                <div className="loading-spinner-small"></div>
              ) : isBookmarked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="gold"
                  viewBox="0 0 256 256"
                >
                  <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="black"
                  viewBox="0 0 256 256"
                >
                  <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                </svg>
              )}
            </button>

            <button
              className={`notification-btn-icon ${
                userHasNotification ? "active" : ""
              } ${loading ? "loading" : ""}`}
              onClick={handleNotificationClick}
              disabled={loading}
              aria-label={
                userHasNotification ? "Change notification" : "Set notification"
              }
            >
              {loading ? (
                <div className="loading-spinner-small"></div>
              ) : userHasNotification ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  viewBox="0 0 30 30"
                >
                  <path d="M 15 3 C 13.9 3 13 3.9 13 5 L 13 5.265625 C 9.5610846 6.1606069 7 9.2910435 7 13 L 7 15.400391 C 7 17.000391 6.6996094 18.5 6.0996094 20 L 23.900391 20 C 23.300391 18.5 23 17.000391 23 15.400391 L 23 13 C 23 9.2910435 20.438915 6.1606069 17 5.265625 L 17 5 C 17 3.9 16.1 3 15 3 z M 5 22 A 1.0001 1.0001 0 1 0 5 24 L 12.173828 24 C 12.068319 24.312339 12 24.644428 12 25 C 12 26.7 13.3 28 15 28 C 16.7 28 18 26.7 18 25 C 18 24.644428 17.931681 24.312339 17.826172 24 L 25 24 A 1.0001 1.0001 0 1 0 25 22 L 5 22 z"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="100"
                  height="100"
                  fill="black"
                  viewBox="0 0 30 30"
                >
                  <path d="M 15 3 C 13.9 3 13 3.9 13 5 L 13 5.265625 C 9.5610846 6.1606069 7 9.2910435 7 13 L 7 15.400391 C 7 17.000391 6.6996094 18.5 6.0996094 20 L 23.900391 20 C 23.300391 18.5 23 17.000391 23 15.400391 L 23 13 C 23 9.2910435 20.438915 6.1606069 17 5.265625 L 17 5 C 17 3.9 16.1 3 15 3 z M 5 22 A 1.0001 1.0001 0 1 0 5 24 L 12.173828 24 C 12.068319 24.312339 12 24.644428 12 25 C 12 26.7 13.3 28 15 28 C 16.7 28 18 26.7 18 25 C 18 24.644428 17.931681 24.312339 17.826172 24 L 25 24 A 1.0001 1.0001 0 1 0 25 22 L 5 22 z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="card-header">
          <div className="card-title-section">
            <div className="restaurant-title-row">
              <div className="restaurant-profile-container">
                <div className="profile-image-wrapper">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={`${currentRestaurant.name} profile`}
                      className="restaurant-profile-pic"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const placeholder = e.target.nextElementSibling;
                        if (placeholder) placeholder.style.display = "block";
                      }}
                    />
                  ) : null}
                </div>
                <div className="restaurant-name-and-tier">
                  <h3 className="restaurant-name">{currentRestaurant.name}</h3>
                  <TierBadge restaurantData={currentRestaurant} />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ UPDATED STATUS BADGE WITH PULSE EFFECT */}
          <div className={`status-badge ${currentRestaurant.crowd_status} ${isUpdating ? 'updating' : ''}`}>
            Crowd Level: {currentRestaurant.crowdLevel || getStatusText(currentRestaurant.crowd_status)}
            {isUpdating && <span className="pulse-dot"></span>}
          </div>
        </div>

        <div className="card-details">
          <div className="card-location-container">
            <span className="location-text">
              <svg
                className="location-icon"
                width="11"
                height="11"
                viewBox="0 -960 960 960"
                fill="currentColor"
                aria-hidden="true"
                color="red"
              >
                <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
              </svg>
              {shortAddress}
            </span>

            <span className="card-cuisine">
              <svg
                width="11"
                height="11"
                viewBox="0 -960 960 960"
                fill="black"
                aria-hidden="true"
              >
                <path d="m175-120-56-56 410-410q-18-42-5-95t57-95q53-53 118-62t106 32q41 41 32 106t-62 118q-42 44-95 57t-95-5l-50 50 304 304-56 56-304-302-304 302Zm118-342L173-582q-54-54-54-129t54-129l248 250-128 128Z" />
              </svg>{" "}
              {currentRestaurant.cuisine}
            </span>
          </div>
        </div>

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
            <h4>Notify me when {currentRestaurant.name} is:</h4>

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
                Remove Notification
              </button>
            )}

            <div className="modal-actions">
              <button
                className="notification-cancel-btn"
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