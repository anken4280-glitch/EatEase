import React, { useState, useEffect } from "react";
import "./RestaurantOwnerDashboard.css";

function RestaurantOwnerDashboard({ user }) {
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

  // DEBUG: Show what we have
  console.log("📝 Form data before send:", formData);
  
  // CREATE NEW OBJECT with ALL fields INCLUDING current_occupancy
  const dataToSend = {
    name: formData.name,
    cuisine_type: formData.cuisine_type,
    address: formData.address,
    phone: formData.phone,
    hours: formData.hours,
    max_capacity: Number(formData.max_capacity) || 50,
    current_occupancy: Number(formData.current_occupancy) || 0, // EXPLICITLY INCLUDE
    features: Array.isArray(formData.features) ? formData.features : [],
    is_featured: false
  };

  console.log("🚀 Data being sent to API:", dataToSend);
  console.log("🔢 current_occupancy in send:", dataToSend.current_occupancy);

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
    console.log("📡 API Response:", data);
    
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
      <header className="owner-header">
        <h1>🏪 Your Restaurant Dashboard</h1>
        <p>Welcome, {user.name}!</p>
      </header>

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
                  // Pre-fill form with existing data
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
                ✏️ Edit
              </button>
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
                <span className="stat-number">{restaurant.crowd_level}</span>
                <span className="stat-label">Crowd Level</span>
              </div>
            </div>
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
                      current_occupancy: Number(e.target.value) || 0
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
    </div>
  );
}

export default RestaurantOwnerDashboard;
