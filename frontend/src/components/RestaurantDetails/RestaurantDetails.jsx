import React from 'react';
import './RestaurantDetails.css';

function RestaurantDetails({ restaurant, onBack }) {
  return (
    <div className="restaurant-details-page">
      {/* Restaurant Header with Image (placeholder) */}
      <div className="restaurant-hero">
        <div className="restaurant-image">
          {/* Placeholder for restaurant image */}
          <div className="image-placeholder">📷 Restaurant Image</div>
        </div>
        
        <div className="restaurant-basic-info">
          <h1>{restaurant.name}</h1>
          <div className={`status-badge large ${restaurant.status}`}>
            {restaurant.crowdLevel} Crowd
          </div>
          <p className="cuisine-type">{restaurant.cuisine}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat">
          <span className="stat-value">{restaurant.occupancy}%</span>
          <span className="stat-label">Occupancy</span>
        </div>
        <div className="stat">
          <span className="stat-value">{restaurant.waitTime} min</span>
          <span className="stat-label">Wait Time</span>
        </div>
        <div className="stat">
          <span className="stat-value">{restaurant.status === 'green' ? 'Low' : restaurant.status === 'yellow' ? 'Moderate' : 'High'}</span>
          <span className="stat-label">Crowd Level</span>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="detailed-info">
        <div className="info-section">
          <h3>📍 Location</h3>
          <p>{restaurant.address}</p>
          <button className="action-btn">Get Directions</button>
        </div>

        <div className="info-section">
          <h3>📞 Contact</h3>
          <p>{restaurant.phone}</p>
          <button className="action-btn">Call Restaurant</button>
        </div>

        <div className="info-section">
          <h3>🕒 Hours</h3>
          <p>{restaurant.hours}</p>
        </div>

        <div className="info-section">
          <h3>📊 Live Status</h3>
          <div className="status-indicator">
            <div className={`status-dot ${restaurant.status}`}></div>
            <span>Currently {restaurant.crowdLevel.toLowerCase()} crowd</span>
          </div>
          <p>Last updated: Just now</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="primary-btn">⭐ Bookmark</button>
        <button className="primary-btn">📱 Share</button>
      </div>
    </div>
  );
}

export default RestaurantDetails;