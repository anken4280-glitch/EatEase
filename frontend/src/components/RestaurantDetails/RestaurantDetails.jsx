import React, { useState, useEffect } from "react";
import "./RestaurantDetails.css";
import profileImage from "../../Assets/Images/profile1.jpg";
import pollingService from "../../services/pollingService"; // Adjust path

// Tab Components
import OverviewTab from "../OverviewTab/OverviewTab";
import MenuTab from "../MenuTab/MenuTab";
import ReviewsTab from "../ReviewsTab/ReviewsTab";
import PhotosTab from "../PhotosTab/PhotosTab";
import PremiumRecommendations from "../PremiumRecommendations/PremiumRecommendations";
import ReservationModal from "../ReservationModal/ReservationModal";

function RestaurantDetails({ restaurantId, onBack }) {
  // ========== HELPER FUNCTION ==========
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // ✅ CORRECT: Use WAMP URL
    const backendBase = "http://localhost/EatEase/backend/public";

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // The API returns paths like "/storage/restaurant-banners/..."
    return `${backendBase}${imagePath}`;
  };

  // ========== STATE VARIABLES ==========
  const [activeTab, setActiveTab] = useState("overview");
  const [restaurant, setRestaurant] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false); // ✅ ADD THIS
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    average_rating: 0,
    total_reviews: 0,
  });

// ========== POLLING FOR REAL-TIME UPDATES ========== 
useEffect(() => {
  if (!restaurantId) return;

  console.log(`RestaurantDetails setting up polling for ${restaurantId}`);
  
  let isMounted = true; // ✅ ADD MOUNT CHECK
  
  // Subscribe to real-time updates
  const unsubscribe = pollingService.subscribe(
    restaurantId,
    (updatedData) => {
      if (!isMounted) return; // ✅ CHECK IF COMPONENT IS STILL MOUNTED
      
      console.log(
        `Details update for restaurant ${restaurantId}:`,
        updatedData,
      );

      setIsUpdating(true);

      // Update restaurant data
      setRestaurant((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          crowd_status: updatedData.crowd_status,
          current_occupancy: updatedData.current_occupancy,
          occupancy_percentage: updatedData.occupancy_percentage,
          crowd_level:
            updatedData.crowd_status === "green"
              ? "Low"
              : updatedData.crowd_status === "yellow"
                ? "Moderate"
                : updatedData.crowd_status === "orange"
                  ? "Busy"
                  : "Full",
        };
      });

      // Hide indicator after 1 second
      setTimeout(() => {
        if (isMounted) setIsUpdating(false); // ✅ CHECK MOUNT
      }, 1000);
    },
  );

  return () => {
    console.log(`🧹 RestaurantDetails cleaning up polling for ${restaurantId}`);
    isMounted = false; // ✅ SET TO FALSE ON CLEANUP
    unsubscribe();
  };
}, [restaurantId]); 

  // ========== IMAGE URLS (CALCULATED FROM RESTAURANT) ==========
  // Calculate these AFTER restaurant is loaded
  const bannerImageUrl = restaurant?.banner_image
    ? getImageUrl(restaurant.banner_image)
    : null;

  const profileImageUrl = restaurant?.profile_image
    ? getImageUrl(restaurant.profile_image)
    : null;

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails();
      fetchReviewsData();
    } else {
      setError("No restaurant ID provided");
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails();
      fetchReviewsData(); // ADD THIS CALL
    } else {
      setError("No restaurant ID provided");
      setLoading(false);
    }
  }, [restaurantId]);

  const fetchReviewsData = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/restaurants/${restaurantId}/reviews`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Reviews data for header:", data);

        if (data.success) {
          setReviewsData({
            reviews: data.reviews || [],
            average_rating: data.average_rating || 0,
            total_reviews: data.total_reviews || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching reviews for header:", error);
      // Don't set error here - we don't want to break the page
    }
  };

  const fetchRestaurantDetails = async () => {
    try {
      setError(null);

      const response = await fetch(
        `http://localhost:8000/api/restaurants/${restaurantId}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Response:", result);

      // EXTRACT THE RESTAURANT OBJECT FROM THE RESPONSE
      const data = result.restaurant || result;

      // Transform data to match expected field names
      const transformedData = {
        id: data.id || restaurantId,
        name: data.name || "Unknown Restaurant",
        cuisine_type: data.cuisine || data.cuisine_type || "Not specified",
        address: data.address || "Address not available",
        phone: data.phone || "No phone number",
        hours: data.hours || "Hours not specified",
        max_capacity: data.max_capacity || data.capacity || 50,
        current_occupancy: data.current_occupancy || data.occupancy || 0,
        occupancy_percentage:
          data.occupancy ||
          data.occupancy_percentage ||
          Math.round(
            ((data.current_occupancy || 0) / (data.max_capacity || 50)) * 100,
          ),
        crowd_status: data.status || data.crowd_status || "green",
        crowd_level: data.crowdLevel || "Low",
        is_verified: data.is_verified || false,
        is_featured: data.isFeatured || data.is_featured || false,
        features: data.features || [],
        // ADD THESE LINES - Get rating from reviewsData if not in restaurant data
        average_rating: data.average_rating || reviewsData.average_rating || 0,
        total_reviews: data.total_reviews || reviewsData.total_reviews || 0,
        // ADD THESE LINES - Banner and Profile images
        banner_image: data.banner_image || null,
        profile_image: data.profile_image || null,
      };

      console.log("Transformed data:", transformedData);
      setRestaurant(transformedData);

      // Fetch stats
      try {
        const statsResponse = await fetch(
          `http://localhost:8000/api/restaurants/${restaurantId}/stats`,
        );
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (statsError) {
        console.log("Stats using defaults");
        setStats({
          average_rating: 0,
          total_reviews: 0,
          menu_items_count: 0,
          photos_count: 0,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      setError("Failed to load restaurant details");
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (!restaurant) return null;

    switch (activeTab) {
      case "overview":
        return <OverviewTab restaurant={restaurant} stats={stats} />;
      case "menu":
        return <MenuTab restaurantId={restaurantId} />;
      case "reviews":
        return (
          <ReviewsTab
            restaurantId={restaurantId}
            restaurantName={restaurant.name}
            reviewsData={reviewsData} // PASS THE DATA
            onReviewsUpdate={fetchReviewsData} // PASS UPDATE FUNCTION
          />
        );
      case "photos":
        return <PhotosTab restaurantId={restaurantId} />;
      default:
        return <OverviewTab restaurant={restaurant} stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="restaurant-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="restaurant-details-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Restaurant</h3>
          <p>{error || "Restaurant not found"}</p>
          <button onClick={onBack} className="retry-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate crowd status text
  const getCrowdStatusText = (status) => {
    switch (status) {
      case "green":
        return "Low Crowd";
      case "yellow":
        return "Moderate";
      case "orange":
        return "Busy";
      case "red":
        return "Full";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="restaurant-details-page">
      {/* ✅ ADD LIVE INDICATOR */}
      {isUpdating && (
        <div className="live-update-indicator">
          <div className="updating-dot"></div>
          <span>Live updating...</span>
        </div>
      )}

      {/* Restaurant Banner */}
      {bannerImageUrl && (
        <div className="restaurant-details-banner">
          <img
            src={bannerImageUrl}
            alt={`${restaurant.name} banner`}
            className="restaurant-details-banner-image"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="restaurant-header">
        <div className="restaurant-basic-info">
          <h1 className="restaurant-name">
            {" "}
            <div className="restaurant-image-container">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${restaurant.name} profile`}
                  className="restaurant-profile-image"
                  onError={(e) => {
                    e.target.src = profileImage; // Fallback to imported image
                  }}
                />
              ) : (
                <img src={profileImage} alt="Restaurant Profile" />
              )}
              {/* <div className="restaurant-image-placeholder">
            /* {restaurant.is_verified && (
              <span className="verified-badge">✅ Verified</span>
          </div> */}
            </div>
            {restaurant.name}
          </h1>
          <div className="restaurant-meta">
            <span className={`crowd-status ${restaurant.crowd_status}`}>
              {getCrowdStatusText(restaurant.crowd_status)}
            </span>
            <span className="occupancy-rate">
              {restaurant.occupancy_percentage}% occupied
            </span>
          </div>
          <p className="cuisine-type">{restaurant.cuisine_type}</p>

          {/* Rating Summary */}
          <div className="rating-summary">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => {
                const rating =
                  reviewsData.average_rating ||
                  stats?.average_rating ||
                  restaurant?.average_rating ||
                  0;
                return (
                  <span
                    key={star}
                    style={{
                      color: star <= Math.round(rating) ? "#FFD700" : "#ddd",
                      fontSize: "18px",
                      margin: "0 2px",
                    }}
                  >
                    {star <= Math.round(rating) ? "★" : "☆"}
                  </span>
                );
              })}
            </div>
            <div className="restaurant-details-rating-numbers">
              <span className="average-rating">
                {Number(
                  reviewsData.average_rating ||
                    stats?.average_rating ||
                    restaurant?.average_rating ||
                    0,
                ).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="stat-item">
          <span className="stat-value">
            {restaurant.current_occupancy}/{restaurant.max_capacity}
          </span>
          <span className="stat-label">Capacity</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">
            {restaurant.crowd_status === "green" && (
              <span className="status-circle green" title="Low Crowd">
                🟢
              </span>
            )}
            {restaurant.crowd_status === "yellow" && (
              <span className="status-circle yellow" title="Moderate Crowd">
                🟡
              </span>
            )}
            {restaurant.crowd_status === "orange" && (
              <span className="status-circle orange" title="Busy">
                🟠
              </span>
            )}
            {restaurant.crowd_status === "red" && (
              <span className="status-circle red" title="Full">
                🔴
              </span>
            )}
            {!["green", "yellow", "orange", "red"].includes(
              restaurant.crowd_status,
            ) && (
              <span className="status-circle gray" title="Unknown">
                ⚪
              </span>
            )}
          </span>
          <span className="stat-label">
            {restaurant.crowd_status === "green" && "Low"}
            {restaurant.crowd_status === "yellow" && "Moderate"}
            {restaurant.crowd_status === "orange" && "Busy"}
            {restaurant.crowd_status === "red" && "Full"}
          </span>
        </div>
        <div className="stat-divider"></div>
      </div>

      <div className="reservation-action-bar">
        <button
          className="reservation-btn"
          onClick={() => setShowReservationModal(true)}
        >
          <span role="img" aria-label="plate"></span> Make Reservation
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          Menu
        </button>
        <button
          className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews
        </button>
        <button
          className={`tab-btn ${activeTab === "photos" ? "active" : ""}`}
          onClick={() => setActiveTab("photos")}
        >
          Photos
          {stats && stats.photos_count > 0 && (
            <span className="tab-badge">{stats.photos_count}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">{renderTabContent()}</div>

      {/* Premium Recommendations */}
      <PremiumRecommendations currentRestaurantId={restaurantId} limit={1} />
      {/* ADD THIS - Reservation Modal */}
      {showReservationModal && restaurant && (
        <ReservationModal
          restaurant={restaurant}
          onClose={() => setShowReservationModal(false)}
          onSuccess={(reservation) => {
            alert(
              `✅ Reservation confirmed! Your code: ${reservation.confirmation_code}`,
            );
            // Optional: Refresh or update UI
          }}
        />
      )}
    </div>
  );
}

export default RestaurantDetails;
