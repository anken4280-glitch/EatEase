import React, { useState, useEffect } from "react";
import PopularTimesChart from "./PopularTimesChart";
import ReviewsSection from "../ReviewsSection/ReviewsSection";
import ReservationModal from "./ReservationModal";
import "./RestaurantCard.css";

export default function RestaurantCard({ restaurant, currentUser }) {
  const [promotions, setPromotions] = useState([]);
  const [showPopularTimes, setShowPopularTimes] = useState(false);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const response = await fetch(
          `http://localhost:4000/api/restaurants/${restaurant.id}/promotions`
        );
        if (response.ok) {
          const data = await response.json();
          setPromotions(data);
        }
      } catch (error) {
        console.error("Error fetching promotions:", error);
      }
    }

    if (restaurant.hasPromo) {
      fetchPromotions();
    }
  }, [restaurant.id, restaurant.hasPromo]);

  const getColor = (status) => {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    if (status === "red") return "🔴";
    return "⚪";
  };

  return (
    <div className="restaurant-card">
      {/* Header */}
      <div className="card-header">
        <h3>{restaurant.name}</h3>
        {restaurant.hasPromo && <span className="promo-badge">🔥 Promo</span>}
      </div>

      <p className="cuisine">{restaurant.cuisine}</p>

      {/* Cleaned IoT section */}
      <div className="iot-data">
        <div className="status-row">
          <span>
            Status: {getColor(restaurant.status)} {restaurant.crowdLevel}
          </span>
        </div>

        {restaurant.rating && (
          <div className="rating-row">
            <span>
              ⭐ {restaurant.rating}/5 ({restaurant.reviewCount || 0} reviews)
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card-actions">
        <button
          onClick={() => setShowPopularTimes(!showPopularTimes)}
          className="action-btn"
        >
          {showPopularTimes ? "📊 Hide Popular Times" : "📊 Show Popular Times"}
        </button>
      </div>

      {/* Popular Times */}
      {showPopularTimes && (
        <div className="popular-times-section">
          <PopularTimesChart restaurant={restaurant} currentTime={new Date()} />
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <div className="promotions-section">
          <h5>Current Promotions:</h5>
          {promotions.map((promo) => (
            <div key={promo.id} className="promotion-item">
              <strong>{promo.title}</strong>
              <p>{promo.description}</p>
              <small>
                Save {promo.discount}% • Valid until{" "}
                {new Date(promo.validUntil).toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Preview */}
      <div className="reviews-preview">
        <ReviewsSection
          restaurantId={restaurant.id}
          currentUser={currentUser}
          compact={true}
        />
      </div>
    </div>
  );
}
