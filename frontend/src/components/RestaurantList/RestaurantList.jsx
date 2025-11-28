import React, { useState, useEffect } from "react";
import { fetchRestaurants, toggleBookmark } from "../../api";
import ReservationModal from "../ReservationModal/ReservationModal";
import './RestaurantList.css';

export default function RestaurantList({ filters, currentUser }) {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, filters]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const data = await fetchRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error("Error loading restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRestaurants = () => {
    let filtered = restaurants;

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.name
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          restaurant.cuisine
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          restaurant.location
            .toLowerCase()
            .includes(filters.search.toLowerCase())
      );
    }

    // Cuisine filter
    if (filters.cuisine !== "all") {
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.cuisine.toLowerCase() === filters.cuisine.toLowerCase()
      );
    }

    // Crowd level filter
    if (filters.crowdLevel !== "all") {
      filtered = filtered.filter(
        (restaurant) => restaurant.status === filters.crowdLevel
      );
    }

    // Has promotion filter
    if (filters.hasPromo) {
      filtered = filtered.filter((restaurant) => restaurant.hasPromo);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter((restaurant) =>
        restaurant.location
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  };

  const handleBookmark = async (restaurantId, e) => {
    e.stopPropagation();
    try {
      const result = await toggleBookmark(restaurantId);
      if (result.success) {
        // Update local state to reflect bookmark change
        setRestaurants((prev) =>
          prev.map((restaurant) =>
            restaurant.id === restaurantId
              ? { ...restaurant, isBookmarked: result.isBookmarked }
              : restaurant
          )
        );
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleMakeReservation = (restaurant, e) => {
    e.stopPropagation();
    setSelectedRestaurant(restaurant);
    setShowReservationModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "green":
        return "#27ae60";
      case "yellow":
        return "#f39c12";
      case "orange":
        return "#e67e22";
      case "red":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "green":
        return "🟢";
      case "yellow":
        return "🟡";
      case "orange":
        return "🟠";
      case "red":
        return "🔴";
      default:
        return "⚪";
    }
  };

  if (loading) {
    return (
      <div className="restaurant-list">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-list">
      <div className="results-header">
        <h3>Found {filteredRestaurants.length} restaurants</h3>
        <div className="status-legend">
          <span className="legend-item">
            <span className="legend-color green"></span> Low (0-60%)
          </span>
          <span className="legend-item">
            <span className="legend-color yellow"></span> Moderate (61-79%)
          </span>
          <span className="legend-item">
            <span className="legend-color orange"></span> High (80-89%)
          </span>
          <span className="legend-item">
            <span className="legend-color red"></span> Full (90-100%)
          </span>
        </div>
      </div>

      {filteredRestaurants.length === 0 ? (
        <div className="no-results">
          <h3>No restaurants found</h3>
          <p>Try adjusting your filters to see more results.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className={`restaurant-card ${
                restaurant.isBookmarked ? "bookmarked" : ""
              }`}
              onClick={() => setSelectedRestaurant(restaurant)}
            >
              <div className="card-header">
                <div className="restaurant-name">
                  <h3>{restaurant.name}</h3>
                  {restaurant.verified && (
                    <span className="verified-badge">✅ Verified</span>
                  )}
                </div>
                <button
                  className={`bookmark-btn ${
                    restaurant.isBookmarked ? "active" : ""
                  }`}
                  onClick={(e) => handleBookmark(restaurant.id, e)}
                  title={
                    restaurant.isBookmarked ? "Remove bookmark" : "Add bookmark"
                  }
                >
                  {restaurant.isBookmarked ? "❤️" : "🤍"}
                </button>
              </div>

              <p className="cuisine-location">
                {restaurant.cuisine} • {restaurant.location}
              </p>

              <div className="status-section">
                <div
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(restaurant.status) }}
                >
                  {getStatusIcon(restaurant.status)}{" "}
                  {restaurant.status.toUpperCase()} ({restaurant.crowdLevel})
                </div>
                <div className="status-details">
                  <span className="occupancy">
                    👥 {restaurant.occupancy}% full
                  </span>
                  <span className="wait-time">
                    ⏱️ {restaurant.waitTime} min wait
                  </span>
                </div>
              </div>

              {/* Features Display */}
              {restaurant.features && restaurant.features.length > 0 && (
                <div className="features-section">
                  <div className="features">
                    {restaurant.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                    {restaurant.features.length > 3 && (
                      <span className="feature-more">
                        +{restaurant.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="card-footer">
                <div className="rating-promo">
                  <span className="rating">⭐ {restaurant.rating}</span>
                  {restaurant.hasPromo && (
                    <span className="promo-badge">🎯 Promotion</span>
                  )}
                </div>

                <button
                  className="reserve-btn"
                  onClick={(e) => handleMakeReservation(restaurant, e)}
                >
                  Reserve Now
                </button>
              </div>

              {/* Quick Info */}
              <div className="quick-info">
                <span className="info-item">📞 {restaurant.phone}</span>
                <span className="info-item">📍 {restaurant.address}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReservationModal && selectedRestaurant && (
        <ReservationModal
          restaurant={selectedRestaurant}
          onClose={() => {
            setShowReservationModal(false);
            setSelectedRestaurant(null);
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
