import React, { useState, useEffect, useRef } from "react";
import SearchBar from "../SearchBar/SearchBar";
import Filters from "../Filters/Filters";
import FeatureCarousel from "../FeatureCarousel/FeatureCarousel";
import RestaurantCard from "../RestaurantCard/RestaurantCard";
import RestaurantDetails from "../RestaurantDetails/RestaurantDetails";
import "./RestaurantList.css";

function RestaurantList({
  user,
  onNavigateToBookmarks,
  onNavigateToNotifications,
}) {
  // ========== STATE VARIABLES ==========
  const [searchQuery, setSearchQuery] = useState(""); // Search input value
  const [filters, setFilters] = useState({}); // Active filters (cuisine, status, etc.)
  const [showFilters, setShowFilters] = useState(false); // Toggle filter panel visibility
  const [selectedRestaurant, setSelectedRestaurant] = useState(null); // Currently selected restaurant for detail view
  const [showMenu, setShowMenu] = useState(false); // Toggle hamburger menu
  const [restaurants, setRestaurants] = useState([]); // List of restaurants from API (REPLACES hardcoded data)
  const [loading, setLoading] = useState(true); // Loading state for API fetch
  const [error, setError] = useState(""); // Error message for failed fetch
  const menuRef = useRef(null); // Ref for detecting clicks outside hamburger menu
  const [notificationCount, setNotificationCount] = useState(0); // ADD THIS
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);

  // ========== USE EFFECTS ==========
  // Effect for closing hamburger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Make refresh function available globally for RestaurantCard
    window.refreshNotificationCount = fetchNotificationCount;

    // Cleanup
    return () => {
      window.refreshNotificationCount = null;
    };
  }, []);

  // Effect for fetching restaurants from API on component mount
  useEffect(() => {
    fetchRestaurants();
    fetchNotificationCount(); // ADD THIS
  }, []); // Empty dependency array means this runs once on mount

  // ========== API FUNCTIONS ==========
  /**
   * Fetches restaurants from the backend API
   * Replaces hardcoded data with real database records
   */
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:8000/api/restaurants");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRestaurants(data.restaurants || []); // Set restaurants from API response
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
      setError("Failed to load restaurants. Please try again.");

      // Fallback to sample data if API fails (for development/demo)
      setRestaurants([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    // Premium filter
    if (showOnlyPremium && !restaurant.isPremium) {
      return false;
    }

    // Search filter (keep your existing search logic)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.cuisine.toLowerCase().includes(query) ||
        restaurant.address.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("No auth token, user might not be logged in");
        return;
      }

      const response = await fetch("http://localhost:8000/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Notifications API response:", data); // Debug log

        if (data.success) {
          setNotificationCount(data.count || data.notifications?.length || 0);
        } else {
          console.warn(
            "Notifications API returned success: false",
            data.message
          );
          setNotificationCount(0);
        }
      } else {
        console.warn("Failed to fetch notifications:", response.status);
        setNotificationCount(0);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
      setNotificationCount(0); // Set to 0 on error
    }
  };

  // ========== HELPER FUNCTIONS ==========
  // Filter featured restaurants for the carousel
  const featuredRestaurants = restaurants.filter(
    (restaurant) => restaurant.isFeatured
  );

  /**
   * Handles restaurant card click
   * @param {Object} restaurant - The clicked restaurant object
   */
  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant); // Switch to detail view
  };

  /**
   * Returns to the restaurant list from detail view
   */
  const handleBackToList = () => {
    setSelectedRestaurant(null); // Clear selected restaurant to show list
  };

  // ========== MENU HANDLERS ==========
  const handleBookmarks = () => {
    setShowMenu(false);
    if (onNavigateToBookmarks) {
      onNavigateToBookmarks();
    }
  };

  const handleNotifications = () => {
    setShowMenu(false);
    fetchNotificationCount(); // Refresh count before navigating
    if (onNavigateToNotifications) {
      onNavigateToNotifications();
    }
  };

  const handleSettings = () => {
    setShowMenu(false);
    console.log("Navigate to Settings");
    // TODO: Implement settings navigation
  };

  const handleRateApp = () => {
    setShowMenu(false);
    console.log("Navigate to Rate App");
    // TODO: Implement rate app functionality
  };

  const handleLogout = () => {
    setShowMenu(false);
    // Clear authentication data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    window.location.reload(); // Reload app to redirect to login
  };

  // ========== RENDER LOGIC ==========
  return (
    <div className="restaurant-list">
      {/* HEADER - Always visible in both list and detail views */}
      <div className="restaurant-list-header">
        {/* Back button - Only shown in detail view */}
        {selectedRestaurant && (
          <button className="back-button-detail-view" onClick={handleBackToList}>
            ←
          </button>
        )}

        {/* Search Bar */}
        {!selectedRestaurant && (
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* ========== ADD PREMIUM FILTER HERE ========== */}
        {/* {!selectedRestaurant && (
          <div className="premium-filter-container">
            <button
              className={`premium-filter-btn ${
                showOnlyPremium ? "active" : ""
              }`}
              onClick={() => setShowOnlyPremium(!showOnlyPremium)}
              title={
                showOnlyPremium
                  ? "Show all restaurants"
                  : "Show only Premium restaurants"
              }
            >
              {showOnlyPremium ? "⭐" : "⭐"}
              {showOnlyPremium}
            </button>
          </div>
        )} */}
        {/* ========== END PREMIUM FILTER ========== */}

        {/* Filters Toggle */}
        {!selectedRestaurant && (
          <Filters
            filters={filters}
            setFilters={setFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />
        )}

        {/* Hamburger Menu with Dropdown */}
        <div className="menu-container" ref={menuRef}>
          <button
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={handleBookmarks}>⭐ Bookmarks</button>
              <button
                onClick={handleNotifications}
                className="notifications-btn"
              >
                🔔 Notifications
                {notificationCount > 0 && (
                  <span className="notification-badge">
                    {notificationCount}
                  </span>
                )}
              </button>
              <button onClick={handleSettings}>⚙️ Settings</button>
              <button onClick={handleRateApp}>🌟 Rate Our App</button>
              <button onClick={handleLogout} className="logout-btn">
                🚪 Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="loading-state">
          <p>Loading restaurants...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchRestaurants}>Retry</button>
        </div>
      )}

      {/* MAIN CONTENT: Either Restaurant Details OR Restaurant List */}
      {selectedRestaurant ? (
        // DETAIL VIEW - When a restaurant is selected
        <RestaurantDetails
          restaurantId={selectedRestaurant.id}
          onBack={handleBackToList}
        />
      ) : (
        // LIST VIEW - When no restaurant is selected AND not loading AND no error
        !loading &&
        !error && (
          <>
            {/* FEATURED RESTAURANTS CAROUSEL */}
            <FeatureCarousel
              restaurants={featuredRestaurants}
              onRestaurantClick={handleRestaurantClick}
            />

            {/* MAIN RESTAURANT LIST */}
            <div className="restaurants-container">
              {/* EMPTY STATE - No restaurants in database */}
              {filteredRestaurants.length === 0 ? (
                <div className="empty-state">
                  {showOnlyPremium ? (
                    <>
                      <p>No Premium restaurants available.</p>
                      <p>Try showing all restaurants instead.</p>
                      <button
                        className="show-all-btn"
                        onClick={() => setShowOnlyPremium(false)}
                      >
                        Show All Restaurants
                      </button>
                    </>
                  ) : (
                    <>
                      <p>No restaurants available yet.</p>
                      <p>
                        Restaurant owners can add their restaurants to appear
                        here.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                // RESTAURANT CARDS GRID - Use filteredRestaurants instead of restaurants
                filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onRestaurantClick={handleRestaurantClick}
                  />
                ))
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}

export default RestaurantList;
