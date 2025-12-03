import React, { useState, useEffect } from 'react';
import './FeatureCarousel.css';

function FeatureCarousel({ restaurants, onRestaurantClick }) {
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);

  useEffect(() => {
    // Filter featured restaurants
    const featured = restaurants.filter(restaurant => restaurant.is_featured === true);
    setFeaturedRestaurants(featured);
  }, [restaurants]);

  const handleRestaurantClick = (restaurant) => {
    if (onRestaurantClick) {
      onRestaurantClick(restaurant);
    }
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'green': return 'green';
      case 'yellow': return 'yellow';
      case 'orange': return 'orange';
      case 'red': return 'red';
      default: return 'green';
    }
  };

  // Empty state - no featured restaurants
  if (featuredRestaurants.length === 0) {
    return (
      <div className="feature-carousel">
        <div className="empty-carousel">
          <div className="empty-icon">✨</div>
          <h4>No Featured Restaurants Yet</h4>
          <p>
            Be the first to feature your restaurant! Get premium visibility 
            and attract more customers with our featured listing.
          </p>
          <button 
            className="cta-button"
            onClick={() => {
              // This could navigate to a "Be Featured" page or open a modal
              alert("Contact admin@eatease.com to feature your restaurant!");
            }}
          >
            🚀 Be Featured Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-carousel">
      <div className="carousel-header">
        <h3>🌟 Featured Restaurants</h3>
        <small>{featuredRestaurants.length} featured</small>
      </div>
      
      <div className="carousel-container">
        {featuredRestaurants.map(restaurant => (
          <div 
            key={restaurant.id} 
            className={`carousel-item ${restaurant.is_featured ? 'featured-highlight' : ''}`}
            onClick={() => handleRestaurantClick(restaurant)}
          >
            <div className="featured-badge">FEATURED</div>
            <div className={`status-indicator ${getStatusClass(restaurant.crowd_status || restaurant.status)}`}></div>
            
            <h4>{restaurant.name}</h4>
            <p className="cuisine">{restaurant.cuisine_type || restaurant.cuisine}</p>
            
            {/* Featured Description */}
            {restaurant.featured_description && (
              <div className="featured-description">
                "{restaurant.featured_description}"
              </div>
            )}
            
            <span className={`crowd-level ${getStatusClass(restaurant.crowd_status || restaurant.status)}`}>
              {restaurant.crowd_level || restaurant.crowd_status?.toUpperCase() || 'LOW'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureCarousel;