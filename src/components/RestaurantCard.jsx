import React, { useState, useEffect } from "react";

export default function RestaurantCard({ restaurant }) {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const response = await fetch(`${API_BASE}/restaurants/${restaurant.id}/promotions`);
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
      </div>

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
      
      <div className="last-updated">
        <small>IoT Updated: {new Date(restaurant.lastUpdated).toLocaleTimeString()}</small>
      </div>
    </div>
  );
}