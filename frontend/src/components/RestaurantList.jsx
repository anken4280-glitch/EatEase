import React, { useEffect, useState } from "react";
import { fetchRestaurants } from "../api";
import RestaurantCard from "./RestaurantCard";
import RestaurantDetailsModal from "./RestaurantDetailsModal";

export default function RestaurantList({ filters, currentUser }) {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----------------------------
  // Auto Error Logging Function
  // ----------------------------
  async function logError(details) {
    console.error("Logged Error:", details);

    // mock log endpoint (optional)
    try {
      await fetch("/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
    } catch {
      // Even if logging fails, ignore it
    }
  }

  // ----------------------------
  // Initial Load
  // ----------------------------
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchRestaurants();
        setRestaurants(data);
        setFilteredRestaurants(data);
      } catch (err) {
        setError("⚠ Failed to load restaurants. Please try again.");
        logError({
          message: "Restaurant fetch failed",
          error: err.toString(),
          time: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ----------------------------
  // Filtering Logic
  // ----------------------------
  useEffect(() => {
    let filtered = restaurants;

    if (filters.cuisine !== "all") {
      filtered = filtered.filter((r) => r.cuisine === filters.cuisine);
    }

    if (filters.hasPromo) {
      filtered = filtered.filter((r) => r.hasPromo);
    }

    if (filters.crowdLevel !== "all") {
      filtered = filtered.filter(
        (r) => r.crowdLevel.toLowerCase() === filters.crowdLevel.toLowerCase()
      );
    }

    if (filters.search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          r.cuisine.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.location) {
      filtered = filtered.filter((r) =>
        r.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  }, [filters, restaurants]);

  // ----------------------------
  // Handlers
  // ----------------------------
  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDetailsModal(true);
  };

  const handleSimilarRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const refreshPage = () => window.location.reload();

  // ----------------------------
  // Loading Screen
  // ----------------------------
  if (loading) {
    return (
      <div className="restaurant-list loading-screen-container">
        <div className="loading-spinner"></div>
        <p>Loading restaurants...</p>
      </div>
    );
  }

  // ----------------------------
  // ERROR UI (Dark Mode Friendly)
  // ----------------------------
  if (error) {
    return (
      <div className="restaurant-list error-container">
        <div className="error-box">
          <h2>⚠ Oops! Something went wrong.</h2>
          <p>{error}</p>

          <button onClick={refreshPage} className="refresh-btn">
            🔄 Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------
  // Main UI
  // ----------------------------
  return (
    <div className="restaurant-list">
      {/* Header Actions */}
      <div className="header-actions">

        <button className="refresh-btn" onClick={refreshPage}>
          🔁 Refresh
        </button>
      </div>

      {filteredRestaurants.length > 0 ? (
        <div className="cards">
          {filteredRestaurants.map((restaurant) => (
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
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No restaurants found matching your filters.</p>
          <button onClick={refreshPage} className="refresh-btn">
            Reset Filters
          </button>
        </div>
      )}

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
