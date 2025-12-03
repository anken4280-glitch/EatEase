import React, { useState, useEffect } from "react";
import VerificationRequest from "../VerificationRequest/VerificationRequest";
import "./RestaurantOwnerDashboard.css";

function RestaurantOwnerDashboard({ user }) {
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
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
                      Verified on: {new Date(restaurant.verified_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : restaurant.verification_requested ? (
                <div className="verification-badge pending">
                  <span className="badge-icon">⏳</span>
                  <span className="badge-text">Verification Pending Review</span>
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
                <h3>✨ Get Your Restaurant Verified</h3>
                <div className="benefits-list">
                  <p><strong>✅ Build Trust:</strong> Customers prefer verified restaurants</p>
                  <p><strong>✅ Increased Visibility:</strong> Higher in search results</p>
                  <p><strong>✅ Official Badge:</strong> Shows on your restaurant card</p>
                  <p><strong>✅ Free Service:</strong> No cost for verification</p>
                </div>
                <button 
                  className="cta-button"
                  onClick={() => setShowVerificationForm(true)}
                >
                  🚀 Request Verification Now
                </button>
                <small>Approval typically takes 24-48 hours</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit/Setup Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{restaurant ? "Edit Restaurant" : "Setup Restaurant"}</h3>
            <form onSubmit={handleSaveRestaurant}>
              {/* Your existing form fields... */}
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
              {/* ... other form fields ... */}
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
    </div>
  );
}

export default RestaurantOwnerDashboard;