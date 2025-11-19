import React, { useState, useEffect } from "react";
import PopularTimesChart from "./PopularTimesChart";
import ReviewsSection from "./ReviewsSection";
import ReservationModal from "./ReservationModal"; // Added import

export default function RestaurantCard({ restaurant, currentUser }) {
  const [promotions, setPromotions] = useState([]);
  const [showPopularTimes, setShowPopularTimes] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false); // Added state

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const response = await fetch(`http://localhost:4000/api/restaurants/${restaurant.id}/promotions`);
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

  const getWaitTimeColor = (minutes) => {
    if (minutes <= 10) return "text-green-600";
    if (minutes <= 20) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="restaurant-card">
      <div className="card-header">
        <h3>{restaurant.name}</h3>
        {restaurant.hasPromo && <span className="promo-badge">🔥 Promo</span>}
      </div>
      
      <p className="cuisine">{restaurant.cuisine}</p>
      
      <div className="iot-data">
        <div className="status-row">
          <span>Status: {getColor(restaurant.status)} {restaurant.crowdLevel}</span>
        </div>
        
        <div className="occupancy-row">
          <span>Occupancy: {restaurant.occupancy}%</span>
          <div className="occupancy-bar">
            <div 
              className={`occupancy-fill ${restaurant.status}`}
              style={{ width: `${restaurant.occupancy}%` }}
            ></div>
          </div>
        </div>
        
        <div className="wait-time">
          <span className={getWaitTimeColor(restaurant.waitTime)}>
            ⏱️ Wait: {restaurant.waitTime} min
          </span>
        </div>

        {restaurant.rating && (
          <div className="rating-row">
            <span>⭐ {restaurant.rating}/5 ({restaurant.reviewCount || 0} reviews)</span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="card-actions">
        <button 
          onClick={() => setShowPopularTimes(!showPopularTimes)}
          className="action-btn"
        >
          {showPopularTimes ? "📊 Hide Popular Times" : "📊 Show Popular Times"}
        </button>
        <button 
          onClick={() => setShowReservationModal(true)}
          className="action-btn reserve-btn"
        >
          📅 Reserve Table
        </button>
      </div>

      {/* Popular Times Chart */}
      {showPopularTimes && (
        <div className="popular-times-section">
          <PopularTimesChart restaurant={restaurant} currentTime={new Date()} />
        </div>
      )}

      {promotions.length > 0 && (
        <div className="promotions-section">
          <h5>Current Promotions:</h5>
          {promotions.map(promo => (
            <div key={promo.id} className="promotion-item">
              <strong>{promo.title}</strong>
              <p>{promo.description}</p>
              <small>Save {promo.discount}% • Valid until {new Date(promo.validUntil).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Section */}
      <div className="reviews-preview">
        <ReviewsSection 
          restaurantId={restaurant.id} 
          currentUser={currentUser}
          compact={true}
        />
      </div>
      
      {/* Reservation Modal */}
      <ReservationModal
        restaurant={restaurant}
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        currentUser={currentUser}
      />

      <div className="last-updated">
        <small>IoT Updated: {new Date(restaurant.lastUpdated).toLocaleTimeString()}</small>
      </div>
    </div>
  );
}
