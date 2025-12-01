import React, { useState, useEffect, useRef } from "react";
import SearchBar from "../SearchBar/SearchBar";
import Filters from "../Filters/Filters";
import FeatureCarousel from "../FeatureCarousel/FeatureCarousel";
import RestaurantCard from "../RestaurantCard/RestaurantCard";
import RestaurantDetails from "../RestaurantDetails/RestaurantDetails";

import "./RestaurantList.css";

function RestaurantList({ user }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // ADD THIS USEEFFECT - PUT IT RIGHT AFTER THE STATE DECLARATIONS
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // null = list view, restaurant object = detail view

  // Sample data
  const restaurants = [
    {
      id: 1,
      name: "Chicken Unlimited",
      cuisine: "Fast Food",
      status: "green",
      crowdLevel: "Low",
      occupancy: 45,
      waitTime: 5,
      isFeatured: true,
      address: "123 Main St",
      phone: "(555) 123-4567",
      hours: "9AM-10PM",
    },
    {
      id: 2,
      name: "Ahmad Brother's Cafe",
      cuisine: "Cafe",
      status: "yellow",
      crowdLevel: "Moderate",
      occupancy: 72,
      waitTime: 15,
      isFeatured: true,
      address: "456 Oak Ave",
      phone: "(555) 987-6543",
      hours: "7AM-9PM",
    },
  ];

  const featuredRestaurants = restaurants.filter(
    (restaurant) => restaurant.isFeatured
  );

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleBackToList = () => {
    setSelectedRestaurant(null);
  };

  // ADD THESE MENU HANDLERS
  const handleBookmarks = () => {
    setShowMenu(false);
    console.log("Navigate to Bookmarks");
    // We'll implement this later
  };

  const handleNotifications = () => {
    setShowMenu(false);
    console.log("Navigate to Notifications");
    // We'll implement this later
  };

  const handleSettings = () => {
    setShowMenu(false);
    console.log("Navigate to Settings");
    // Placeholder for now
  };

  const handleRateApp = () => {
    setShowMenu(false);
    console.log("Navigate to Rate App");
    // Placeholder for now
  };

  const handleLogout = () => {
    setShowMenu(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    window.location.reload(); // This will redirect to login
  };

  return (
    <div className="restaurant-list">
      {/* Header - ALWAYS VISIBLE */}
      <div className="restaurant-list-header">
        {/* Back button when in detail view */}
        {selectedRestaurant && (
          <button className="back-button" onClick={handleBackToList}>
            ← Back
          </button>
        )}

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <Filters
          filters={filters}
          setFilters={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        {/* UPDATED HAMBURGER MENU WITH REF */}
        <div className="menu-container" ref={menuRef}>
          <button
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            ☰
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={handleBookmarks}>⭐ Bookmarks</button>
              <button onClick={handleNotifications}>🔔 Notifications</button>
              <button onClick={handleSettings}>⚙️ Settings</button>
              <button onClick={handleRateApp}>🌟 Rate Our App</button>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Show either Restaurant Details or Restaurant List */}
      {selectedRestaurant ? (
        <RestaurantDetails
          restaurant={selectedRestaurant}
          onBack={handleBackToList}
        />
      ) : (
        <>
          {/* Featured Carousel */}
          <FeatureCarousel restaurants={featuredRestaurants} />

          {/* Restaurant List */}
          <div className="restaurants-container">
            <h2>Nearby Restaurants</h2>
            <p>Found {restaurants.length} restaurants</p>

            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onRestaurantClick={handleRestaurantClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RestaurantList;
