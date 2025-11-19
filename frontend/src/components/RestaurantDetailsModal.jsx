import React, { useState } from "react";
import PopularTimesChart from "./PopularTimesChart";
import ReviewsSection from "./ReviewsSection";
import SimilarRestaurants from "./SimilarRestaurants";

export default function RestaurantDetailsModal({ 
  restaurant, 
  isOpen, 
  onClose, 
  currentUser,
  onSimilarRestaurantSelect 
}) {
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen || !restaurant) return null;

  const getColor = (status) => {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    if (status === "red") return "🔴";
    return "⚪";
  };

  return (
    <div className="modal-overlay detailed-modal">
      <div className="modal-content restaurant-details-modal">
        <div className="modal-header">
          <div className="restaurant-title">
            <h2>{restaurant.name}</h2>
            <p className="restaurant-cuisine">{restaurant.cuisine}</p>
          </div>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-value">{getColor(restaurant.status)} {restaurant.crowdLevel}</span>
            <span className="stat-label">Current Crowd</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{restaurant.waitTime} min</span>
            <span className="stat-label">Wait Time</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{restaurant.occupancy}%</span>
            <span className="stat-label">Occupancy</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">⭐ {restaurant.rating || "N/A"}/5</span>
            <span className="stat-label">Rating</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="details-tabs">
          <button 
            className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            📊 Details
          </button>
          <button 
            className={`tab-btn ${activeTab === "times" ? "active" : ""}`}
            onClick={() => setActiveTab("times")}
          >
            🕒 Popular Times
          </button>
          <button 
            className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            💬 Reviews
          </button>
          <button 
            className={`tab-btn ${activeTab === "similar" ? "active" : ""}`}
            onClick={() => setActiveTab("similar")}
          >
            🍽️ Similar
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "details" && (
            <div className="details-content">
              <div className="iot-status">
                <h4>📡 Real-time IoT Status</h4>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="label">Crowd Level:</span>
                    <span className={`value status-${restaurant.status}`}>
                      {restaurant.crowdLevel}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="label">Occupancy:</span>
                    <span className="value">{restaurant.occupancy}%</span>
                  </div>
                  <div className="status-item">
                    <span className="label">Wait Time:</span>
                    <span className="value">{restaurant.waitTime} minutes</span>
                  </div>
                  <div className="status-item">
                    <span className="label">Last Updated:</span>
                    <span className="value">
                      {new Date(restaurant.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {restaurant.description && (
                <div className="restaurant-description">
                  <h4>About</h4>
                  <p>{restaurant.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "times" && (
            <div className="times-content">
              <PopularTimesChart restaurant={restaurant} currentTime={new Date()} />
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="reviews-content">
              <ReviewsSection 
                restaurantId={restaurant.id} 
                currentUser={currentUser}
                compact={false}
              />
            </div>
          )}

          {activeTab === "similar" && (
            <div className="similar-content">
              <SimilarRestaurants 
                currentRestaurant={restaurant}
                onRestaurantSelect={onSimilarRestaurantSelect}
              />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button className="btn-primary">
            🗺️ Get Directions
          </button>
        </div>
      </div>
    </div>
  );
}