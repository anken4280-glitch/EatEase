import React from 'react';
import '../RestaurantDetails/RestaurantDetails.css';

const OverviewTab = ({ restaurant, stats }) => {
  return (
    <div className="overview-tab">
      {/* Basic Information */}
      <div className="info-section">
        <h3 className="section-title">📍 Location</h3>
        <p className="section-content">{restaurant.address}</p>
      </div>

      <div className="info-section">
        <h3 className="section-title">📞 Contact</h3>
        <p className="section-content">{restaurant.phone || 'Not provided'}</p>
      </div>

      <div className="info-section">
        <h3 className="section-title">🕒 Operating Hours</h3>
        <p className="section-content">{restaurant.hours || 'Not specified'}</p>
      </div>

      {/* Features/Amenities */}
      {restaurant.features && restaurant.features.length > 0 && (
        <div className="info-section">
          <h3 className="section-title">✨ Features</h3>
          <div className="features-grid">
            {restaurant.features.map((feature, index) => (
              <span key={index} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Restaurant Description */}
      <div className="info-section">
        <h3 className="section-title">📝 About</h3>
        <p className="section-content description">
          {restaurant.description || 
           `Welcome to ${restaurant.name}! Enjoy delicious ${restaurant.cuisine_type} cuisine.`}
        </p>
      </div>
    </div>
  );
};

export default OverviewTab;