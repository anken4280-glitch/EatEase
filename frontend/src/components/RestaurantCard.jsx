import React, { useState } from "react";
import PopularTimesChart from "./PopularTimesChart";
import ReviewsSection from "./ReviewsSection";

export default function RestaurantCard({ restaurant, currentUser, onEdit }) {
  const [showPopularTimes, setShowPopularTimes] = useState(false);

  // Determine color based on crowd status and occupancy
  const getColor = (status, occupancy) => {
    if (occupancy >= 100) return "🔴"; // Full
    if (occupancy >= 80) return "🟠";  // Almost full
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    return "⚪";
  };

  return (
    <div className="restaurant-card">
      {/* Cover photo */}
      {restaurant.coverPhoto && (
        <img src={restaurant.coverPhoto} alt="Cover" className="cover-photo" />
      )}

      <div className="card-header">
        <h3>{restaurant.name}</h3>
        {/* Profile picture */}
        {restaurant.profilePic && (
          <img src={restaurant.profilePic} alt="Profile" className="profile-pic" />
        )}
      </div>

      <p className="cuisine">{restaurant.cuisine}</p>

      {/* Basic Info */}
      <div className="iot-data">
        <span>
          Status: {getColor(restaurant.status, restaurant.occupancy)} {restaurant.crowdLevel}{" "}
          {restaurant.occupancy != null && `• ${restaurant.occupancy}% full`}
        </span>
        {restaurant.rating && (
          <span>⭐ {restaurant.rating}/5 ({restaurant.reviewCount || 0} reviews)</span>
        )}
      </div>

      {/* Restaurant Details */}
      <div className="restaurant-details">
        {restaurant.openHours && <p><strong>Open Hours:</strong> {restaurant.openHours}</p>}
        {restaurant.maxTables && <p><strong>Max Tables:</strong> {restaurant.maxTables}</p>}
        {restaurant.contactNumber && <p><strong>Contact:</strong> {restaurant.contactNumber}</p>}
        {restaurant.overview && <p><strong>Overview:</strong> {restaurant.overview}</p>}
        {restaurant.menu && <p><strong>Menu:</strong> {restaurant.menu}</p>}
        {restaurant.photos && restaurant.photos.length > 0 && (
          <div className="photo-gallery">
            {restaurant.photos.map((url, index) => (
              <img key={index} src={url} alt={`Photo ${index + 1}`} className="food-photo" />
            ))}
          </div>
        )}
        {restaurant.direction && (
          <p><strong>Direction / Map:</strong> <a href={restaurant.direction} target="_blank" rel="noreferrer">View Map</a></p>
        )}
        {restaurant.priceRange && <p><strong>Price Range:</strong> {restaurant.priceRange}</p>}
      </div>

      {/* Card Actions */}
      <div className="card-actions">
        <button onClick={() => setShowPopularTimes(!showPopularTimes)}>
          {showPopularTimes ? "📊 Hide Popular Times" : "📊 Show Popular Times"}
        </button>

        {/* Edit button for restaurant owners */}
        {currentUser?.type === "restaurant_owner" && (
          <button onClick={onEdit}>✏️ Edit Restaurant</button>
        )}
      </div>

      {/* Popular Times Chart */}
      {showPopularTimes && (
        <PopularTimesChart restaurant={restaurant} currentTime={new Date()} />
      )}

      {/* Reviews Section */}
      <ReviewsSection restaurantId={restaurant.id} currentUser={currentUser} compact />
    </div>
  );
}
