import React from 'react';
import './RestaurantCard.css';

function RestaurantCard({ restaurant, onRestaurantClick }) {
  const handleClick = () => {
    onRestaurantClick(restaurant);
  };

  return (
    <div className="restaurant-card" onClick={handleClick}>
      <div className="card-header">
        <h3>{restaurant.name}</h3>
        <div className={`status-badge ${restaurant.status}`}>
          {restaurant.crowdLevel}
        </div>
      </div>
      <div className="card-details">
        <p className="cuisine">{restaurant.cuisine}</p>
        <p className="occupancy">Occupancy: {restaurant.occupancy}%</p>
      </div>
    </div>
  );
}

export default RestaurantCard;
