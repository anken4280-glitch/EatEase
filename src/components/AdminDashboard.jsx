import React, { useState, useEffect } from "react";
import { fetchRestaurants, updateRestaurantStatus } from "../api";

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    title: "",
    description: "",
    discount: "",
    validUntil: ""
  });

  useEffect(() => {
    async function loadData() {
      const data = await fetchRestaurants();
      setRestaurants(data);
      if (data.length > 0) setSelectedRestaurant(data[0]);
    }
    loadData();
  }, []);

  const handleUpdateStatus = async (id, status, crowdLevel) => {
    const result = await updateRestaurantStatus(id, status, crowdLevel);
    if (result) {
      alert(`✅ ${result.restaurant.name} updated to ${status.toUpperCase()} (${crowdLevel})`);
      setRestaurants(prev =>
        prev.map(r => (r.id === id ? result.restaurant : r))
      );
    }
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/promotions`, {
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

  return (
    <div className="restaurant-dashboard">
      <div className="dashboard-header">
        <h2>Restaurant Dashboard</h2>
        <div className="restaurant-selector">
          <label>Select Restaurant:</label>
          <select 
            value={selectedRestaurant?.id || ""} 
            onChange={(e) => setSelectedRestaurant(
              restaurants.find(r => r.id === parseInt(e.target.value))
            )}
          >
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedRestaurant && (
        <div className="dashboard-content">
          <div className="restaurant-info">
            <h3>{selectedRestaurant.name}</h3>
            <p>Cuisine: {selectedRestaurant.cuisine}</p>
            <div className="current-status">
              <h4>Current Status: 
                <span className={`status-${selectedRestaurant.status}`}>
                  {selectedRestaurant.status.toUpperCase()} 
                  ({selectedRestaurant.crowdLevel})
                </span>
              </h4>
              <p>Occupancy: {selectedRestaurant.occupancy}%</p>
              <p>Wait Time: {selectedRestaurant.waitTime} min</p>
            </div>
          </div>

          <div className="management-section">
            <div className="status-controls">
              <h4>Update Crowd Status</h4>
              <div className="status-buttons">
                <button onClick={() => handleUpdateStatus(selectedRestaurant.id, "green", "Low")}>
                  🟢 Low
                </button>
                <button onClick={() => handleUpdateStatus(selectedRestaurant.id, "yellow", "Moderate")}>
                  🟡 Moderate
                </button>
                <button onClick={() => handleUpdateStatus(selectedRestaurant.id, "red", "High")}>
                  🔴 High
                </button>
              </div>
            </div>

            <div className="promotion-section">
              <h4>Promotion Management</h4>
              <button 
                className="create-promo-btn"
                onClick={() => setShowPromotionForm(true)}
              >
                CREATE PROMOTION
              </button>
            </div>
          </div>

          {showPromotionForm && (
            <div className="promotion-form-overlay">
              <div className="promotion-form">
                <h4>Create New Promotion</h4>
                <form onSubmit={handleCreatePromotion}>
                  <label>
                    Title:
                    <input
                      type="text"
                      value={newPromotion.title}
                      onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                      required
                    />
                  </label>
                  <label>
                    Description:
                    <textarea
                      value={newPromotion.description}
                      onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                      required
                    />
                  </label>
                  <label>
                    Discount (%):
                    <input
                      type="number"
                      value={newPromotion.discount}
                      onChange={(e) => setNewPromotion({...newPromotion, discount: e.target.value})}
                      required
                    />
                  </label>
                  <label>
                    Valid Until:
                    <input
                      type="date"
                      value={newPromotion.validUntil}
                      onChange={(e) => setNewPromotion({...newPromotion, validUntil: e.target.value})}
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
    </div>
  );
}