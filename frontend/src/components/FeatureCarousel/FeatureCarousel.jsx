import React from 'react';
import './FeatureCarousel.css';

function FeatureCarousel({ restaurants }) {
  return (
    <div className="feature-carousel">
      <div className="carousel-container">
        {restaurants.map(restaurant => (
          <div key={restaurant.id} className="carousel-item">
            <div className={`status-indicator ${restaurant.status}`}></div>
            <h4>{restaurant.name}</h4>
            <p>{restaurant.cuisine}</p>
            <span className="crowd-level">{restaurant.crowdLevel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureCarousel;