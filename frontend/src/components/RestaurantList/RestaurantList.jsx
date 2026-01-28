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
  onNavigateToReservations,
}) {
  // ========== STATE VARIABLES ==========
  const [searchQuery, setSearchQuery] = useState(""); // Search input value
  const [filters, setFilters] = useState({
    cuisine: "all",
    crowd_status: [],
    min_rating: 0,
    tier: "all",
    featured: false,
  }); // Active filters (cuisine, status, etc.)
  const [showFilters, setShowFilters] = useState(false); // Toggle filter panel visibility
  const [selectedRestaurant, setSelectedRestaurant] = useState(null); // Currently selected restaurant for detail view
  const [showMenu, setShowMenu] = useState(false); // Toggle hamburger menu
  const [restaurants, setRestaurants] = useState([]); // List of restaurants from API (REPLACES hardcoded data)
  const [loading, setLoading] = useState(true); // Loading state for API fetch
  const [error, setError] = useState(""); // Error message for failed fetch
  const menuRef = useRef(null); // Ref for detecting clicks outside hamburger menu
  const [notificationCount, setNotificationCount] = useState(0); // ADD THIS
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Add this for refresh animation
  // In RestaurantList function, add with other states:
  const [allNotifications, setAllNotifications] = useState([]);

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
    fetchNotificationCount();
    // Cleanup polling on unmount
    return () => {
      // You can add cleanup if needed, but pollingService manages its own cleanup
      console.log(
        "RestaurantList unmounting - polling cleanup handled by service",
      );
    }; // ADD THIS
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const fetchAllNotifications = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const response = await fetch(
          "http://localhost:8000/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAllNotifications(data.notifications || []);
            setNotificationCount(data.count || data.notifications?.length || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchAllNotifications();
  }, []); // Empty dependency = runs once on mount

  // ========== API FUNCTIONS ==========
  /**
   * Fetches restaurants from the backend API
   * Replaces hardcoded data with real database records
   */
  // In RestaurantList.jsx - update fetchRestaurants function
  const fetchRestaurants = async (filters = {}) => {
    try {
      setLoading(true);
      setError("");

      // Build query string from filters
      const params = new URLSearchParams();

      if (filters.cuisine && filters.cuisine !== "all") {
        params.append("cuisine", filters.cuisine);
      }

      if (filters.crowd_status && filters.crowd_status.length > 0) {
        filters.crowd_status.forEach((status) => {
          params.append("crowd_status[]", status);
        });
      }

      if (filters.min_rating && filters.min_rating > 0) {
        params.append("min_rating", filters.min_rating);
      }

      if (filters.tier && filters.tier !== "all") {
        params.append("tier", filters.tier);
      }

      if (filters.featured) {
        params.append("featured", "true");
      }

      const queryString = params.toString();
      const url = queryString
        ? `http://localhost:8000/api/restaurants?${queryString}`
        : `http://localhost:8000/api/restaurants`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRestaurants(data.restaurants || []);

      // Update active filters
      if (data.filters) {
        setFilters(filters);
      }
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
      setError("Failed to load restaurants. Please try again.");

      // Fallback to sample data if API fails
      setRestaurants([
        {
          id: 1,
          name: "Chicken Unlimited",
          cuisine: "Fast Food",
          cuisine_type: "Fast Food",
          status: "green",
          crowdLevel: "Low",
          occupancy: 45,
          waitTime: 5,
          isFeatured: true,
          address: "123 Main St",
          phone: "(555) 123-4567",
          hours: "9AM-10PM",
          isPremium: false,
          subscription_tier: "basic",
        },
        // ... other sample restaurants
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
        console.log("Notifications API response:", data);

        if (data.success) {
          setAllNotifications(data.notifications || []); // UPDATE THIS
          setNotificationCount(data.count || data.notifications?.length || 0);
        } else {
          console.warn(
            "Notifications API returned success: false",
            data.message,
          );
          setNotificationCount(0);
        }
      } else {
        console.warn("Failed to fetch notifications:", response.status);
        setNotificationCount(0);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
      setNotificationCount(0);
    }
  };

  // ========== HELPER FUNCTIONS ==========
  // Filter featured restaurants for the carousel
  const featuredRestaurants = restaurants.filter(
    (restaurant) => restaurant.isFeatured,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRestaurants(); // Refresh the list
    setIsRefreshing(false);
  };

  // ========== RENDER LOGIC ==========
  return (
    <div className="restaurant-list">
      {/* HEADER - Always visible in both list and detail views */}
      <div className="restaurant-list-header">
        {/* Back button - Only shown in detail view */}
        {selectedRestaurant && (
          <button
            className="back-button-detail-view"
            onClick={handleBackToList}
            aria-label="Back to restaurant list"
          >
            <svg
              className="back-icon"
              width="24"
              height="24"
              viewBox="0 -960 960 960"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
            </svg>
          </button>
        )}

        {/* Search Bar */}
        {!selectedRestaurant && (
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* RIGHT SIDE: Refresh button - Only shown in detail view */}
        {selectedRestaurant && (
          <button
            className="refresh-button-detail-view"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh restaurant details"
            title="Refresh restaurant details"
          >
            {isRefreshing ? (
              <svg
                className="refresh-spinner spinning"
                width="24"
                height="24"
                viewBox="0 -960 960 960"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
              </svg>
            ) : (
              <svg
                className="refresh-icon"
                width="24"
                height="24"
                viewBox="0 -960 960 960"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
              </svg>
            )}
          </button>
        )}

        {/* Filters Toggle */}
        {!selectedRestaurant && (
          <Filters
            filters={filters}
            setFilters={setFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onApplyFilters={fetchRestaurants} // Pass the fetch function
          />
        )}

        {/* Hamburger Menu with Dropdown */}
        {!selectedRestaurant && (
          <div className="menu-container" ref={menuRef}>
            <button
              className="menu-button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="22px"
                viewBox="0 -960 960 960"
                width="27px"
                fill="#e3e3e3"
              >
                <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="dropdown-menu">
                <button
                  onClick={() => {
                    setShowMenu(false); // Close menu here
                    onNavigateToReservations();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="black"
                  >
                    <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                  </svg>
                  Reservations
                </button>
                <button onClick={handleBookmarks}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="black"
                  >
                    <path d="M160-80v-560q0-33 23.5-56.5T240-720h320q33 0 56.5 23.5T640-640v560L400-200 160-80Zm80-121 160-86 160 86v-439H240v439Zm480-39v-560H280v-80h440q33 0 56.5 23.5T800-800v560h-80ZM240-640h320-320Z" />
                  </svg>
                  Bookmarks
                </button>
                <button
                  onClick={handleNotifications}
                  className="notifications-btn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="#000000"
                  >
                    <path d="M480-489Zm0 409q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM160-200v-80h80v-280q0-84 50.5-149T422-793q-10 22-15.5 46t-7.5 49q-35 21-57 57t-22 81v280h320v-122q20 3 40 3t40-3v122h80v80H160Zm480-280-12-60q-12-5-22.5-10.5T584-564l-58 18-40-68 46-40q-2-13-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T628-820l12-60h80l12 60q12 5 22.5 10.5T776-796l58-18 40 68-46 40q2 13 2 26t-2 26l46 40-40 68-58-18q-11 8-21.5 13.5T732-540l-12 60h-80Zm40-120q33 0 56.5-23.5T760-680q0-33-23.5-56.5T680-760q-33 0-56.5 23.5T600-680q0 33 23.5 56.5T680-600Z" />
                  </svg>
                  Notifications
                </button>
                <button onClick={handleSettings}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="#000000"
                  >
                    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                  </svg>
                  Settings
                </button>
                <button onClick={handleRateApp}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="black"
                  >
                    <path d="m384-334 96-74 96 74-36-122 90-64H518l-38-124-38 124H330l90 64-36 122ZM233-120l93-304L80-600h304l96-320 96 320h304L634-424l93 304-247-188-247 188Zm247-369Z" />
                  </svg>
                  Rate Our App
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 -960 960 960"
                    width="20px"
                    fill="red"
                  >
                    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
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

            {/* ========== NEW: AVAILABLE RESTAURANTS HEADER ========== */}
            <div className="available-restaurants-header">
              <div className="header-left">
                <h2 className="available-title">Available Restaurants:</h2>
                {/* <span className="restaurant-count">
                  ({filteredRestaurants.length} restaurants)
                </span> */}
              </div>

              <button
                className="refresh-button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh restaurant list"
              >
                {isRefreshing ? (
                  <svg
                    className="refresh-spinner"
                    width="20"
                    height="20"
                    viewBox="0 -960 960 960"
                    fill="currentColor"
                  >
                    <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                  </svg>
                ) : (
                  <svg
                    className="refresh-icon"
                    width="20"
                    height="20"
                    viewBox="0 -960 960 960"
                    fill="currentColor"
                  >
                    <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                  </svg>
                )}
              </button>
            </div>

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
                    allNotifications={allNotifications}
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
