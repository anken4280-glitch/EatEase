import React, { useState, useEffect, useRef } from "react";
import VerificationRequest from "../VerificationRequest/VerificationRequest";
import "./RestaurantOwnerDashboard.css";

// Import tab components (we'll create owner versions)
import OwnerOverviewTab from "./OwnerOverviewTab";
import OwnerMenuTab from "./OwnerMenuTab";
import OwnerReviewsTab from "./OwnerReviewsTab";
import OwnerPhotosTab from "./OwnerPhotosTab";
import AnalyticsTab from "./AnalyticsTab";

function RestaurantOwnerDashboard({ user }) {
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [featuredDescription, setFeaturedDescription] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [menuText, setMenuText] = useState("");
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [tier, setTier] = useState("basic");
  const [showMenu, setShowMenu] = useState(false); // Toggle hamburger menu
  const menuRef = useRef(null); // Ref for detecting clicks outside hamburger menu
  const [canBeFeatured, setCanBeFeatured] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    cuisine_type: "",
    address: "",
    phone: "",
    hours: "",
    max_capacity: 50,
    current_occupancy: 0,
    features: [],
  });

  useEffect(() => {
    if (user && user.user_type === "restaurant_owner") {
      fetchTier();
      fetchRestaurant();
    }
  }, [user]);

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

  const fetchTier = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        "http://localhost:8000/api/subscription/tier",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include",
        },
      );

      const data = await response.json();
      console.log("Tier API Response:", data);

      if (data.success) {
        setTier(data.tier);
        setCanBeFeatured(data.can_be_featured);

        // Handle case where user needs to create restaurant first
        if (data.needs_setup) {
          console.log("User needs to create a restaurant first");
          setShowCreateRestaurant(true);
        }
      } else {
        console.error("Tier API error:", data.message);

        // If restaurant not found, default to basic tier
        if (
          data.message === "Restaurant not found" ||
          data.message === "No restaurant found"
        ) {
          setTier("basic");
          setCanBeFeatured(false);
          setShowCreateRestaurant(true);
        }
      }
    } catch (error) {
      console.error("Error fetching tier:", error);
      // Default to basic on error
      setTier("basic");
      setCanBeFeatured(false);
    }
  };

  const handleUpgrade = async () => {
    if (
      !confirm(
        "Upgrade to Premium tier? This will unlock all features including the ability to apply for featured status.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        "http://localhost:8000/api/subscription/upgrade",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        alert("Successfully upgraded to Premium tier!");
        setTier("premium");
        setCanBeFeatured(true);
      } else {
        alert("Upgrade failed: " + data.message);
      }
    } catch (error) {
      console.error("Error upgrading tier:", error);
      alert("Error upgrading tier");
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const saveMenuText = async () => {
    await fetch(`/api/restaurants/${restaurantId}/menu-text`, {
      method: "POST",
      body: JSON.stringify({ menu_text: menuText }),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleRequestFeature = async () => {
    const token = localStorage.getItem("auth_token");

    if (!featuredDescription.trim()) {
      alert("Please enter a description for your featured listing!");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/restaurant/request-feature",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            featured_description: featuredDescription,
          }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        alert("✅ Feature request submitted! Our team will review it shortly.");
        setShowFeatureModal(false);
        setFeaturedDescription("");
        fetchRestaurant();
      } else {
        alert("Failed to submit request: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Feature request error:", error);
      alert("Failed to submit request. Please try again.");
    }
  };

  const fetchRestaurant = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch("http://localhost:8000/api/restaurant/my", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Restaurant API Response:", data);

      if (response.status === 404) {
        setRestaurant(null);
        // Check if it's the "needs_setup" 404
        if (data.needs_setup) {
          setShowCreateRestaurant(true);
        }
      } else if (response.ok && data.success) {
        setRestaurant(data.restaurant);
        setShowCreateRestaurant(false);

        // Update tier based on restaurant data
        if (data.restaurant) {
          setTier(data.restaurant.subscription_tier || "basic");
          setCanBeFeatured(data.restaurant.can_be_featured || false);
        }
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      setRestaurant(null);
      setShowCreateRestaurant(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("auth_token");

    const dataToSend = {
      name: formData.name,
      cuisine_type: formData.cuisine_type,
      address: formData.address,
      phone: formData.phone,
      hours: formData.hours,
      max_capacity: Number(formData.max_capacity) || 50,
      current_occupancy: Number(formData.current_occupancy) || 0,
      features: Array.isArray(formData.features) ? formData.features : [],
      is_featured: false,
    };

    try {
      const response = await fetch(
        "http://localhost:8000/api/restaurant/save",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify(dataToSend),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setRestaurant(data.restaurant);
        setIsEditing(false);
        setFormData({
          name: "",
          cuisine_type: "",
          address: "",
          phone: "",
          hours: "",
          max_capacity: 50,
          current_occupancy: 0,
          features: [],
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (!restaurant) return null;

    switch (activeTab) {
      case "overview":
        return (
          <OwnerOverviewTab
            restaurant={restaurant}
            onEdit={() => {
              setFormData({
                name: restaurant.name,
                cuisine_type: restaurant.cuisine_type,
                address: restaurant.address,
                phone: restaurant.phone,
                hours: restaurant.hours,
                max_capacity: restaurant.max_capacity,
                current_occupancy: restaurant.current_occupancy,
                features: restaurant.features || [],
              });
              setIsEditing(true);
            }}
          />
        );
      case "menu":
        return <OwnerMenuTab restaurantId={restaurant.id} />;
      case "reviews":
        return <OwnerReviewsTab restaurantId={restaurant.id} />;
      case "photos":
        return <OwnerPhotosTab restaurantId={restaurant.id} />;
      case "analytics": // NEW TAB
        return (
          <AnalyticsTab
            restaurantId={restaurant.id}
            isPremium={tier === "premium"}
          />
        );
      default:
        return (
          <OwnerOverviewTab
            restaurant={restaurant}
            onEdit={() => {
              setFormData({
                name: restaurant.name,
                cuisine_type: restaurant.cuisine_type,
                address: restaurant.address,
                phone: restaurant.phone,
                hours: restaurant.hours,
                max_capacity: restaurant.max_capacity,
                current_occupancy: restaurant.current_occupancy,
                features: restaurant.features || [],
              });
              setIsEditing(true);
            }}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="restaurant-owner-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-owner-dashboard">
      {!restaurant ? (
        // No restaurant setup yet
        <div className="setup-prompt">
          <div className="empty-state">
            <h3>No Restaurant Setup Yet</h3>
            <p>Set up your restaurant profile to start receiving diners</p>

            {/* Tier info for new users */}
            <div className="tier-info-prompt">
              <h4>
                Subscription:{" "}
                <span className={`tier-badge ${tier}`}>
                  {tier === "premium" ? "⭐ Premium" : "Free Tier"}
                </span>
              </h4>
              <p>
                {tier === "basic"
                  ? "Start with Free tier. Upgrade after creating your restaurant."
                  : "You're on Premium tier! Create your restaurant to unlock all features."}
              </p>
            </div>

            <button className="setup-btn" onClick={() => setIsEditing(true)}>
              Set Up My Restaurant
            </button>
          </div>
        </div>
      ) : (
        // Restaurant exists - show enhanced dashboard
        <div className="restaurant-owner-view">
          {/* Header with Title and Logout */}
          <div className="owner-title-row">
            <h1 className="owner-title">
              <div className="restaurant-title-section">
                <h2 className="restaurant-owner-name">
                  {restaurant.name}{" "}
                  <span className={`header-tier-badge ${tier}`}>
                    {tier === "premium" ? "Premium" : "Free"}
                  </span>
                </h2>
              </div>
            </h1>
            {/* Hamburger Menu with Dropdown - Only Edit & Logout */}
<div className="menu-container" ref={menuRef}>
  <button
    className="menu-button"
    onClick={() => setShowMenu(!showMenu)}
    aria-label="Toggle menu"
  >
    {/* Hamburger Icon SVG */}
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      height="24px" 
      viewBox="0 -960 960 960" 
      width="24px" 
      fill="currentColor"
      className={`hamburger-icon ${showMenu ? 'active' : ''}`}
    >
      <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
    </svg>
  </button>

  {/* Dropdown Menu - Only Edit Profile and Logout */}
  {showMenu && (
    <div className="dropdown-menu">
      <button 
        className="dropdown-item edit-item"
        onClick={() => {
          setFormData({
            name: restaurant.name,
            cuisine_type: restaurant.cuisine_type,
            address: restaurant.address,
            phone: restaurant.phone,
            hours: restaurant.hours,
            max_capacity: restaurant.max_capacity,
            current_occupancy: restaurant.current_occupancy,
            features: restaurant.features || [],
          });
          setIsEditing(true);
          setShowMenu(false);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
        </svg>
        <span>Edit Profile</span>
      </button>
      
      <button 
        onClick={() => {
          setShowMenu(false);
          handleLogout();
        }}
        className="dropdown-item logout-btn"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
        </svg>
        <span>Log Out</span>
      </button>
    </div>
  )}
</div>
          </div>
          {/* Verification Status */}
          {/* <div className="owner-verification-status">
                {restaurant.is_verified ? (
                  <div className="verification-badge verified">
                    <span className="badge-icon">✅</span>
                    <span className="badge-text">Verified Restaurant</span>
                  </div>
                ) : restaurant.verification_requested ? (
                  <div className="verification-badge pending">
                    <span className="badge-icon">⏳</span>
                    <span className="badge-text">Verification Pending</span>
                  </div>
                ) : (
                  <div className="verification-badge not-verified">
                    <span className="badge-icon">⚠️</span>
                    <span className="badge-text">Not Verified</span>
                    {/* Conditional feature button 
                    {canBeFeatured ? (
                      <button
                        className="request-verification-btn"
                        onClick={() => setShowVerificationForm(true)}
                      >
                        Request Verification
                      </button>
                    ) : (
                      <button
                        className="request-verification-btn disabled"
                        disabled
                        title="Upgrade to Premium to verify"
                      >
                        Upgrade for Verification
                      </button>
                    )}
                  </div>
                )}
              </div> */}
          <div className="content-wrapper">
            <div className="owner-header">
              {/* Restaurant Name and Verification Status */}

              {/* Quick Stats */}
              <div className="owner-quick-stats">
                <div className="owner-stat-card">
                  <span className="owner-stat-value">
                    {restaurant.current_occupancy}/{restaurant.max_capacity}
                  </span>
                  <span className="owner-stat-label">Current Capacity</span>
                </div>
                <div className="owner-stat-card">
                  <span className="owner-stat-value">
                    {restaurant.occupancy_percentage}%
                  </span>
                  <span className="owner-stat-label">Occupancy</span>
                </div>
                <div className="owner-stat-card">
                  <span
                    className={`owner-stat-value status-${restaurant.crowd_status}`}
                  >
                    {restaurant.crowd_status === "green"
                      ? "Low"
                      : restaurant.crowd_status === "yellow"
                        ? "Moderate"
                        : restaurant.crowd_status === "orange"
                          ? "Busy"
                          : "Very High"}
                  </span>
                  <span className="owner-stat-label">
                    Crowd <br />
                    Status
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="owner-tab-navigation">
              <button
                className={`owner-tab-btn ${
                  activeTab === "overview" ? "active" : ""
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`owner-tab-btn ${
                  activeTab === "menu" ? "active" : ""
                }`}
                onClick={() => setActiveTab("menu")}
              >
                Menu
              </button>
              <button
                className={`owner-tab-btn ${
                  activeTab === "reviews" ? "active" : ""
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                Reviews
              </button>
              <button
                className={`owner-tab-btn ${
                  activeTab === "photos" ? "active" : ""
                }`}
                onClick={() => setActiveTab("photos")}
              >
                Photos
              </button>
              <button
                className={`owner-tab-btn ${
                  activeTab === "analytics" ? "active" : ""
                } ${tier === "premium" ? "premium-unlocked" : "premium-locked"}`}
                onClick={() => setActiveTab("analytics")}
                title={
                  tier === "basic"
                    ? "Upgrade to Premium to access analytics"
                    : "View analytics"
                }
              >
                {tier === "premium" ? "Analytics" : "Analytics"}
              </button>
            </div>

            {/* Tab Content */}
            <div className="owner-tab-content">{renderTabContent()}</div>
            {/* Tier Section */}
            <div className="tier-section">
              <div className="tier-info">
                {tier === "basic" ? (
                  <div className="basic-tier">
                    <span className="tier-badge basic">Free Tier</span>
                    <p className="tier-description">
                      • Manual updates only
                      <br />
                      • Cannot apply for featured status
                      <br />• Basic features only
                    </p>
                    <button className="upgrade-btn" onClick={handleUpgrade}>
                      Upgrade to Premium
                    </button>
                  </div>
                ) : (
                  <div className="premium-tier">
                    <span className="tier-badge premium">Premium</span>
                    <p className="tier-description">
                      • Automatic IoT updates
                      <br />
                      • Can apply for featured status
                      <br />
                      • Full analytics access
                      <br />• Advertisement capabilities
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Feature CTA - Conditional based on tier */}
            {!restaurant.is_featured && (
              <div className="owner-feature-cta">
                <div className="feature-cta-content">
                  <h3>Want more customers?</h3>
                  <p>
                    Get featured on our homepage and get 3x more visibility!
                  </p>

                  {/* Conditional feature button */}
                  {canBeFeatured ? (
                    <button
                      className="feature-cta-button"
                      onClick={() => setShowFeatureModal(true)}
                    >
                      Be Featured Now
                    </button>
                  ) : (
                    <button
                      className="feature-cta-button disabled"
                      disabled
                      title="Upgrade to Premium to be featured"
                    >
                      Upgrade to Be Featured
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit/Setup Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{restaurant ? "Edit Restaurant" : "Setup Restaurant"}</h3>

            <form onSubmit={handleSaveRestaurant}>
              <div className="form-group">
                <label>Restaurant Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter restaurant name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cuisine Type *</label>
                <input
                  type="text"
                  value={formData.cuisine_type}
                  onChange={(e) =>
                    setFormData({ ...formData, cuisine_type: e.target.value })
                  }
                  placeholder="e.g., Fast Food, Cafe, Filipino"
                  required
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Full address"
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div className="form-group">
                <label>Operating Hours *</label>
                <input
                  type="text"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                  placeholder="e.g., 9AM-10PM, Mon-Sun"
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Capacity *</label>
                <input
                  type="number"
                  value={formData.max_capacity || ""} // Show empty string for 0
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      max_capacity:
                        val === "" ? 0 : Math.max(0, parseInt(val) || 0),
                    });
                  }}
                  placeholder="Maximum number of customers"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Current Occupancy</label>
                <input
                  type="number"
                  value={formData.current_occupancy || ""} // Show empty string for 0
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      current_occupancy:
                        val === "" ? 0 : Math.max(0, Number(val) || 0),
                    });
                  }}
                  placeholder="Current number of customers"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Features (optional)</label>
                <div className="features-checkboxes">
                  {[
                    "WiFi",
                    "Parking",
                    "Air Conditioned",
                    "Outdoor Seating",
                    "Takeout",
                    "Delivery",
                  ].map((feature) => (
                    <label className="feature-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature)}
                        onChange={(e) => {
                          const newFeatures = e.target.checked
                            ? [...formData.features, feature]
                            : formData.features.filter((f) => f !== feature);
                          setFormData({ ...formData, features: newFeatures });
                        }}
                      />
                      <span className="checkbox-label">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Request Modal */}
      {showVerificationForm && (
        <div className="modal-overlay">
          <div className="modal-content verification-modal">
            <VerificationRequest
              restaurant={restaurant}
              onRequestSubmitted={() => {
                fetchRestaurant();
              }}
              onClose={() => setShowVerificationForm(false)}
            />
          </div>
        </div>
      )}

      {/* Be Featured Now Modal */}
      {showFeatureModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowFeatureModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Be Featured Now</h3>
            <p className="modal-subtitle">
              Get premium visibility on the homepage! Featured restaurants get
              3x more views.
            </p>

            <div className="form-group">
              <label>Why should your restaurant be featured? *</label>
              <textarea
                value={featuredDescription}
                onChange={(e) => setFeaturedDescription(e.target.value)}
                placeholder="Tell diners what makes your restaurant special..."
                rows="6"
                maxLength="300"
                required
              />
              <small className="char-count">
                {featuredDescription.length}/300 characters
              </small>
            </div>

            <div className="benefits-list">
              <h4>Featured Benefits:</h4>
              <ul>
                <li>Top placement on homepage</li>
                <li>3x more visibility</li>
                <li>Special featured badge</li>
                <li>Custom description display</li>
                <li>Priority in search results</li>
              </ul>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowFeatureModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestFeature}
                disabled={!featuredDescription.trim()}
                className="primary-btn"
              >
                Submit Feature Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantOwnerDashboard;
