import React, { useState, useEffect } from "react";
import VerificationRequest from "../VerificationRequest/VerificationRequest";
import "./RestaurantOwnerDashboard.css";

function RestaurantOwnerDashboard({ user }) {
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFeatureModal, setShowFeatureModal] = useState(false); // For Be featured
  const [featuredDescription, setFeaturedDescription] = useState("");
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
    fetchRestaurant();
  }, []);

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
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("✅ Feature request submitted! Our team will review it shortly.");
        setShowFeatureModal(false);
        setFeaturedDescription("");
        fetchRestaurant(); // Refresh restaurant data
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
      });

      if (response.status === 404) {
        // No restaurant yet
        setRestaurant(null);
      } else if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
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
        }
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

  if (loading) {
    return (
      <div className="restaurant-owner-dashboard">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-owner-dashboard">
      {!restaurant ? (
        // No restaurant setup yet
        <div className="setup-prompt">
          <div className="empty-state">
            <div className="empty-icon">🏪</div>
            <h3>No Restaurant Setup Yet</h3>
            <p>Set up your restaurant profile to start receiving diners</p>
            <button className="setup-btn" onClick={() => setIsEditing(true)}>
              🎯 Set Up My Restaurant
            </button>
          </div>
        </div>
      ) : (
        // Restaurant exists - show dashboard
        <div className="restaurant-dashboard">
          <div className="restaurant-card">
            <div className="card-header">
              <h2>{restaurant.name}</h2>
              <button
                className="edit-btn"
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
                }}
              >
                Edit
              </button>
            </div>

            {/* VERIFICATION STATUS BADGE */}
            <div className="verification-status">
              {restaurant.is_verified ? (
                <div className="verification-badge verified">
                  <span className="badge-icon">✅</span>
                  <span className="badge-text">Verified Restaurant</span>
                  {restaurant.verified_at && (
                    <span className="verified-date">
                      Verified on:{" "}
                      {new Date(restaurant.verified_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : restaurant.verification_requested ? (
                <div className="verification-badge pending">
                  <span className="badge-icon">⏳</span>
                  <span className="badge-text">
                    Verification Pending Review
                  </span>
                </div>
              ) : (
                <div className="verification-badge not-verified">
                  <span className="badge-icon">⚠️</span>
                  <span className="badge-text">Not Verified</span>
                  <button
                    className="request-verification-btn"
                    onClick={() => setShowVerificationForm(true)}
                  >
                    Request Verification
                  </button>
                </div>
              )}
            </div>

            <div className="restaurant-info">
              <p>
                <strong>Cuisine:</strong> {restaurant.cuisine_type}
              </p>
              <p>
                <strong>Address:</strong> {restaurant.address}
              </p>
              <p>
                <strong>Contact:</strong> {restaurant.phone}
              </p>
              <p>
                <strong>Hours:</strong> {restaurant.hours}
              </p>
              <p>
                <strong>Current Status:</strong>
                <span className={`status-${restaurant.crowd_status}`}>
                  {restaurant.crowd_level} ({restaurant.occupancy_percentage}%)
                </span>
              </p>
              <p>
                <strong>Capacity:</strong> {restaurant.current_occupancy}/
                {restaurant.max_capacity} people
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="stats-overview">
            <h3>Live Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">
                  {restaurant.current_occupancy}
                </span>
                <span className="stat-label">Current Customers</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {restaurant.occupancy_percentage}%
                </span>
                <span className="stat-label">Occupancy Rate</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {restaurant.is_verified ? "✅" : "❌"}
                </span>
                <span className="stat-label">Verification Status</span>
              </div>
            </div>
          </div>

          {/* Verification CTA Section */}
          {!restaurant.is_verified && !restaurant.verification_requested && (
            <div className="verification-cta">
              <div className="cta-content">
                <h3>✨ Get Verified</h3>
                <div className="benefits-list">
                  <p>
                    <strong>✅ Build Trust:</strong> Customers prefer verified
                    restaurants
                  </p>
                  <p>
                    <strong>✅ Increased Visibility:</strong> Higher in search
                    results
                  </p>
                  <p>
                    <strong>✅ Official Badge:</strong> Shows on your restaurant
                    card
                  </p>
                  <p>
                    <strong>✅ Free Service:</strong> No cost for verification
                  </p>
                </div>
                <button
                  className="cta-button"
                  onClick={() => setShowVerificationForm(true)}
                >
                  Request Verification Now
                </button>
              </div>
            </div>
          )}

          {/* Be Featured Now CTA - Add this where you want it to appear */}
          <div className="feature-cta">
            <h3>🌟 Get Featured</h3>
            <p>
              Stand out from the crowd! Get premium placement on our homepage.
            </p>
            <button
              className="feature-cta-btn"
              onClick={() => setShowFeatureModal(true)}
            >
              🚀 Be Featured Now
            </button>
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
                  value={formData.max_capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_capacity: parseInt(e.target.value) || 50,
                    })
                  }
                  placeholder="Maximum number of customers"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Current Occupancy</label>
                <input
                  type="number"
                  value={formData.current_occupancy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_occupancy: Number(e.target.value) || 0,
                    })
                  }
                  placeholder="Current number of customers"
                  min="0"
                  required
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
                    <label key={feature} className="feature-checkbox">
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
                      {feature}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit">Save Restaurant</button>
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
                // Refresh restaurant data after submission
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
            <h3>🚀 Be Featured Now</h3>
            <p className="modal-subtitle">
              Get premium visibility on the homepage! Featured restaurants get
              3x more views.
            </p>

            <div className="form-group">
              <label>Why should your restaurant be featured? *</label>
              <textarea
                value={featuredDescription}
                onChange={(e) => setFeaturedDescription(e.target.value)}
                placeholder="Tell diners what makes your restaurant special... 
(e.g., 'Best chicken in town! Try our secret recipe!', 
'Cozy atmosphere perfect for family dinners', 
'Authentic local cuisine with modern twist')"
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
                <li>✅ Top placement on homepage</li>
                <li>✅ 3x more visibility</li>
                <li>✅ Special featured badge</li>
                <li>✅ Custom description display</li>
                <li>✅ Priority in search results</li>
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
