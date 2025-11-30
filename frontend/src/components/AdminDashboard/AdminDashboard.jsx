import React, { useState, useEffect } from "react";
import { fetchRestaurants, updateRestaurantStatus, updateRestaurant } from "../../api";
import PopularTimesChart from "../PopularTimesChart/PopularTimesChart";
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    title: "",
    description: "",
    discount: "",
    validUntil: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const restaurantsData = await fetchRestaurants();
      setRestaurants(restaurantsData);
      if (restaurantsData.length > 0) setSelectedRestaurant(restaurantsData[0]);

      // Mock users data
      setUsers([
        { id: 1, name: "John Doe", email: "user@example.com", type: "diner", joined: "2024-01-15" },
        { id: 2, name: "Restaurant Owner", email: "owner@example.com", type: "restaurant_owner", joined: "2024-01-10" },
        { id: 3, name: "Jane Smith", email: "jane@example.com", type: "diner", joined: "2024-01-20" },
        { id: 4, name: "Mike Johnson", email: "mike@example.com", type: "restaurant_owner", joined: "2024-01-05" }
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, crowdLevel) => {
    try {
      const result = await updateRestaurantStatus(id, status, crowdLevel);
      if (result) {
        alert(`✅ ${result.restaurant.name} updated to ${status.toUpperCase()} (${crowdLevel})`);
        setRestaurants(prev =>
          prev.map(r => (r.id === id ? result.restaurant : r))
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPromotion,
          restaurantId: selectedRestaurant.id
        })
      });

      if (response.ok) {
        alert("Promotion created successfully!");
        setShowPromotionForm(false);
        setNewPromotion({ title: "", description: "", discount: "", validUntil: "" });
      }
    } catch (error) {
      console.error("Error creating promotion:", error);
    }
  };

  const handleEditUser = (userId) => {
    alert(`Edit user ${userId} - This would open user edit modal`);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      alert(`Delete user ${userId} - This would delete user from database`);
    }
  };

  const handleEditRestaurant = (restaurant) => {
    alert(`Edit restaurant ${restaurant.id} - This would open restaurant edit modal`);
  };

  const handleDeleteRestaurant = (restaurantId) => {
    if (window.confirm("Are you sure you want to delete this restaurant?")) {
      alert(`Delete restaurant ${restaurantId} - This would delete restaurant from database`);
    }
  };

  const handleVerifyRestaurant = (restaurantId) => {
    alert(`Verify restaurant ${restaurantId} - This would mark restaurant as verified`);
  };

  if (loading) {
    return <div className="loading-screen-container">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="view-header">
        <h2>Admin Dashboard</h2>
        <p>Manage restaurants, users, and system settings</p>
      </div>

      <nav className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`admin-tab ${activeTab === "restaurants" ? "active" : ""}`}
          onClick={() => setActiveTab("restaurants")}
        >
          🏪 Restaurants
        </button>
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>
        <button
          className={`admin-tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📈 Analytics
        </button>
      </nav>

      <div className="admin-content">
        {activeTab === "overview" && (
          <div className="overview-grid">
            <div className="stat-card">
              <h3>Total Restaurants</h3>
              <p className="stat-number">{restaurants.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-number">{users.length}</p>
            </div>
            <div className="stat-card">
              <h3>Active Today</h3>
              <p className="stat-number">24</p>
            </div>
            <div className="stat-card">
              <h3>System Status</h3>
              <p className="stat-number online">Online</p>
            </div>
          </div>
        )}

        {activeTab === "restaurants" && (
          <div className="restaurant-management">
            <h3>Manage All Restaurants</h3>
            <div className="cards" style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="restaurant-card admin-card" style={{ flex: "1 1 300px" }}>
                  <div className="card-header">
                    <h4>{restaurant.name}</h4>
                    <span className={`status-badge ${restaurant.status}`}>
                      {restaurant.crowdLevel}
                    </span>
                  </div>

                  <div className="restaurant-info">
                    <p><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                    <p><strong>Occupancy:</strong> {restaurant.occupancy}%</p>
                    <p><strong>Location:</strong> {restaurant.location}</p>
                  </div>

                  <div className="popular-times-admin">
                    <h5>Popular Times Analytics</h5>
                    <PopularTimesChart restaurant={restaurant} currentTime={new Date()} />
                  </div>

                  <div className="admin-controls">
                    <h5>Admin Controls:</h5>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <button
                        onClick={() => handleUpdateStatus(restaurant.id, "green", "Low")}
                        className={`control-btn green ${restaurant.status === "green" ? "active" : ""}`}
                        style={{ minWidth: "100px" }}
                      >
                        Set Low
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(restaurant.id, "yellow", "Moderate")}
                        className={`control-btn yellow ${restaurant.status === "yellow" ? "active" : ""}`}
                        style={{ minWidth: "120px" }}
                      >
                        Set Moderate
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(restaurant.id, "red", "High")}
                        className={`control-btn red ${restaurant.status === "red" ? "active" : ""}`}
                        style={{ minWidth: "100px" }}
                      >
                        Set High
                      </button>
                      <button
                        onClick={() => handleEditRestaurant(restaurant)}
                        className="control-btn edit"
                        style={{ minWidth: "120px" }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        className="control-btn delete"
                        style={{ minWidth: "120px" }}
                      >
                        🗑️ Delete
                      </button>
                      {!restaurant.verified && (
                        <button
                          onClick={() => handleVerifyRestaurant(restaurant.id)}
                          className="control-btn verify"
                          style={{ minWidth: "140px" }}
                        >
                          ✅ Verify
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="promotion-section">
                    <h5>Promotion Management</h5>
                    <button
                      className="create-promo-btn"
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setShowPromotionForm(true);
                      }}
                    >
                      CREATE PROMOTION
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showPromotionForm && selectedRestaurant && (
              <div className="promotion-form-overlay">
                <div className="promotion-form">
                  <h4>Create New Promotion for {selectedRestaurant.name}</h4>
                  <form onSubmit={handleCreatePromotion}>
                    <label>
                      Title:
                      <input
                        type="text"
                        value={newPromotion.title}
                        onChange={(e) => setNewPromotion({ ...newPromotion, title: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Description:
                      <textarea
                        value={newPromotion.description}
                        onChange={(e) => setNewPromotion({ ...newPromotion, description: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Discount (%):
                      <input
                        type="number"
                        value={newPromotion.discount}
                        onChange={(e) => setNewPromotion({ ...newPromotion, discount: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Valid Until:
                      <input
                        type="date"
                        value={newPromotion.validUntil}
                        onChange={(e) => setNewPromotion({ ...newPromotion, validUntil: e.target.value })}
                        required
                      />
                    </label>
                    <div className="form-buttons">
                      <button type="submit">Create Promotion</button>
                      <button type="button" onClick={() => setShowPromotionForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="user-management">
            <h3>Manage Users</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`user-type ${user.type}`}>{user.type}</span>
                      </td>
                      <td>{user.joined}</td>
                      <td>
                        <div className="user-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button onClick={() => handleEditUser(user.id)} className="action-btn edit">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteUser(user.id)} className="action-btn delete">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="analytics">
            <h3>System Analytics</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>Restaurant Distribution</h4>
                <div className="chart-placeholder">
                  <p>📊 Chart: Restaurant types by cuisine</p>
                  <p>Italian: {restaurants.filter((r) => r.cuisine === "Italian").length}</p>
                  <p>Japanese: {restaurants.filter((r) => r.cuisine === "Japanese").length}</p>
                  <p>Mexican: {restaurants.filter((r) => r.cuisine === "Mexican").length}</p>
                  <p>American: {restaurants.filter((r) => r.cuisine === "American").length}</p>
                  <p>Indian: {restaurants.filter((r) => r.cuisine === "Indian").length}</p>
                </div>
              </div>
              <div className="analytics-card">
                <h4>User Activity</h4>
                <div className="chart-placeholder">
                  <p>📈 Chart: Daily active users</p>
                  <p>Diners: {users.filter((u) => u.type === "diner").length}</p>
                  <p>Owners: {users.filter((u) => u.type === "restaurant_owner").length}</p>
                </div>
              </div>
              <div className="analytics-card">
                <h4>Crowd Patterns</h4>
                <div className="chart-placeholder">
                  <p>🕒 Chart: Peak hours analysis</p>
                  <p>Low Crowd: {restaurants.filter((r) => r.status === "green").length}</p>
                  <p>Moderate: {restaurants.filter((r) => r.status === "yellow").length}</p>
                  <p>High Crowd: {restaurants.filter((r) => r.status === "red").length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
