import React, { useEffect, useState } from "react";
import { fetchRestaurants } from "../api";
import RestaurantCard from "./RestaurantCard";

export default function RestaurantList({ filters }) {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);

  useEffect(() => {
    async function loadData() {
      const data = await fetchRestaurants();
      setRestaurants(data);
      setFilteredRestaurants(data);
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = restaurants;

    if (filters.cuisine !== "all") {
      filtered = filtered.filter(r => r.cuisine === filters.cuisine);
    }

    if (filters.hasPromo) {
      filtered = filtered.filter(r => r.hasPromo);
    }

    if (filters.crowdLevel !== "all") {
      filtered = filtered.filter(r => 
        r.crowdLevel.toLowerCase() === filters.crowdLevel.toLowerCase()
      );
    }

    if (filters.search) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  }, [filters, restaurants]);

  return (
    <div className="restaurant-list">
      <div className="results-info">
        <p>Found {filteredRestaurants.length} restaurants</p>
      </div>
      <div className="cards">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
        ) : (
          <div className="no-results">
            <p>No restaurants found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}