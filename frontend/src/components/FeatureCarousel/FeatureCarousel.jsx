import React, { useState, useEffect } from "react";
import "./FeatureCarousel.css";

function FeatureCarousel({ restaurants, onRestaurantClick }) {
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});

  useEffect(() => {
    // Filter featured restaurants
    const featured = restaurants.filter(
      (restaurant) =>
        restaurant.is_featured === true || restaurant.isFeatured === true,
    );
    console.log("🌟 Featured restaurants:", featured);
    setFeaturedRestaurants(featured);
  }, [restaurants]);

  const handleRestaurantClick = (restaurant) => {
    if (onRestaurantClick) {
      onRestaurantClick(restaurant);
    }
  };

  const handleArrowClick = (e, restaurant) => {
    e.stopPropagation();
    handleRestaurantClick(restaurant);
  };

  const getStatusClass = (status) => {
    if (!status) return "green";
    switch (status.toLowerCase()) {
      case "green":
        return "green";
      case "yellow":
        return "yellow";
      case "orange":
        return "orange";
      case "red":
        return "red";
      default:
        return "green";
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return "Low Crowd";
    switch (status.toLowerCase()) {
      case "green":
        return "Low Crowd";
      case "yellow":
        return "Moderate";
      case "orange":
        return "Busy";
      case "red":
        return "Full";
      default:
        return "Low Crowd";
    }
  };

  // ✅ FIXED: Use the working URL format
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // Use the same format as RestaurantCard.jsx
    const backendBase = "http://localhost/EatEase/backend/public";

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // The API returns paths like "/storage/restaurant-banners/..."
    return `${backendBase}${imagePath}`;
  };

  const handleImageLoad = (restaurantId) => {
    console.log(`✅ Image loaded for restaurant ${restaurantId}`);
    setLoadedImages((prev) => ({ ...prev, [restaurantId]: true }));
  };

  const handleImageError = (restaurantId, url) => {
    console.error(
      `❌ Image failed to load for restaurant ${restaurantId}:`,
      url,
    );
    setLoadedImages((prev) => ({ ...prev, [restaurantId]: false }));
  };

  // Empty state - no featured restaurants
  if (featuredRestaurants.length === 0) {
    return (
      <div className="feature-carousel">
        <div className="carousel-header">
          <h3>Featured Restaurants</h3>
        </div>
        <div className="empty-carousel">
          <h4>No Featured Restaurants Yet</h4>
          <p>Premium restaurants can feature themselves to appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-carousel">
      <div className="carousel-header">
        <h3>Check Out:</h3>
      </div>

      <div className="carousel-container">
        {featuredRestaurants.map((restaurant) => {
          const imageUrl = getImageUrl(restaurant.banner_image);
          const hasLoaded = loadedImages[restaurant.id];

          console.log(`Rendering ${restaurant.name}:`, {
            imageUrl: imageUrl,
            hasLoaded: hasLoaded,
            banner_image: restaurant.banner_image,
          });

          return (
            <div
              key={restaurant.id}
              className="carousel-item"
              onClick={() => handleRestaurantClick(restaurant)}
            >
              {/* Featured Badge */}
              <div className="featured-badge">FEATURED</div>

              {/* Crowd Status Indicator */}
              <div className="crowd-status-indicator">
                <div
                  className={`status-dot ${getStatusClass(restaurant.crowd_status || restaurant.status)}`}
                ></div>
                <span>
                  {getStatusLabel(restaurant.crowd_status || restaurant.status)}
                </span>
              </div>

              {/* Banner Image Container */}
              <div className="feature-banner-container">
                {/* Show image if URL exists and hasn't failed */}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={`${restaurant.name} banner`}
                    className="feature-banner-image"
                    style={{
                      display: hasLoaded === false ? "none" : "block",
                      opacity: hasLoaded ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                    onLoad={() => handleImageLoad(restaurant.id)}
                    onError={() => handleImageError(restaurant.id, imageUrl)}
                  />
                )}

                {/* Show placeholder if no image URL or image failed to load */}
                {(hasLoaded === false || !imageUrl) && (
                  <div className="feature-banner-placeholder">
                    {restaurant.name}
                  </div>
                )}

                {/* Restaurant Name Overlay (Bottom Left) */}
                <div className="restaurant-name-overlay">
                  <h4>{restaurant.name}</h4>
                  {(restaurant.cuisine_type || restaurant.cuisine) && (
                    <div className="cuisine-badge">
                      {restaurant.cuisine_type || restaurant.cuisine}
                    </div>
                  )}
                </div>

                {/* Arrow Button (Bottom Right) */}
                <button
                  className="arrow-button"
                  onClick={(e) => handleArrowClick(e, restaurant)}
                  aria-label={`View ${restaurant.name} details`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FeatureCarousel;
