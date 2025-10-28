import React from "react";

export default function RestaurantCard({ restaurant }) {
  const getColor = (status) => {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    if (status === "red") return "🔴";
    return "⚪";
  };

  return (
    <div className="restaurant-card">
      <h3>{restaurant.name}</h3>
      <p>Status: {getColor(restaurant.status)} {restaurant.crowdLevel}</p>
    </div>
  );
}
