import React, { useEffect, useState } from "react";
import { fetchRestaurants } from "../api";
import RestaurantCard from "./RestaurantCard";

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    async function loadData() {
      const data = await fetchRestaurants();
      setRestaurants(data);
    }
    loadData();
  }, []);

  return (
    <div className="restaurant-list">
      <h2>Nearby Restaurants</h2>
      <div className="cards">
        {restaurants.length > 0 ? (
          restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
        ) : (
          <p>Loading restaurant data...</p>
        )}
      </div>
    </div>
  );
}
