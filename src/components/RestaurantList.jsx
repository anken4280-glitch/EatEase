import React, { useEffect, useState } from "react";
import { fetchRestaurants } from "../api";
import RestaurantCard from "./RestaurantCard";
import RestaurantDetailsModal from "./RestaurantDetailsModal";

export default function RestaurantList({ filters, currentUser }) {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailsModal(true);
  };

  const handleSimilarRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
    // Keep modal open, just update the content
  };

  return (
    <div className="restaurant-list">
      <div className="results-info">
        <p>Found {filteredRestaurants.length} restaurants</p>
        {filteredRestaurants.length > 0 && (
          <button 
            className="view-as-grid-btn"
            onClick={() => document.querySelector('.cards').classList.toggle('list-view')}
          >
            🔄 Toggle View
          </button>
        )}
      </div>
      
      <div className="cards">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((restaurant) => (
            <div 
              key={restaurant.id} 
              className="restaurant-card-wrapper"
              onClick={() => handleRestaurantSelect(restaurant)}
            >
              <RestaurantCard 
                restaurant={restaurant} 
                currentUser={currentUser}
              />
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No restaurants found matching your filters.</p>
            <button 
              onClick={() => window.location.reload()}
              className="reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <RestaurantDetailsModal
        restaurant={selectedRestaurant}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        currentUser={currentUser}
        onSimilarRestaurantSelect={handleSimilarRestaurantSelect}
      />
    </div>
  );
}