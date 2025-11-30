import React, { useState, useEffect } from "react";
import { fetchRestaurants, updateRestaurant } from "../../api";
import RestaurantCard from "../RestaurantCard/RestaurantCard";

export default function RestaurantOwnerDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Load restaurants on mount
  useEffect(() => {
    async function loadRestaurants() {
      try {
        setLoading(true);
        const data = await fetchRestaurants();
        setRestaurants(data);
      } catch (err) {
        setError("⚠ Failed to load restaurants. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  const refreshPage = () => window.location.reload();

  // Open edit modal
  const handleEditClick = (restaurant) => {
    setEditingRestaurant(restaurant);
    setEditFormData({ ...restaurant });
  };

  // Handle changes in the form
  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save edits
  const handleSaveEdit = async () => {
    try {
      const updated = await updateRestaurant(editingRestaurant.id, editFormData);
      setRestaurants(prev =>
        prev.map(r => r.id === editingRestaurant.id ? updated.restaurant : r)
      );
      setEditingRestaurant(null);
    } catch (err) {
      console.error("Error updating restaurant:", err);
      alert("Failed to save changes");
    }
  };

  if (loading) {
    return (
      <div className="loading-screen-container">
        <div className="loading-spinner"></div>
        <p>Loading restaurants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠ Oops! Something went wrong.</h2>
        <p>{error}</p>
        <button onClick={refreshPage}>🔄 Refresh Page</button>
      </div>
    );
  }

  return (
    <div className="restaurant-owner-dashboard">
      {restaurants.length > 0 ? (
        <div className="restaurant-cards">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="restaurant-card-wrapper">
              <RestaurantCard 
                restaurant={restaurant} 
                currentUser={{ type: "restaurant_owner" }}
                onEdit={() => handleEditClick(restaurant)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No restaurants found.</p>
          <button onClick={refreshPage}>Refresh</button>
        </div>
      )}

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <div className="edit-restaurant-modal">
          <div className="edit-modal-content">
            <h3>Edit Restaurant: {editingRestaurant.name}</h3>

            {/** General info **/}
            <label>Name:<input type="text" value={editFormData.name} onChange={(e) => handleInputChange("name", e.target.value)} /></label>
            <label>Location:<input type="text" value={editFormData.location} onChange={(e) => handleInputChange("location", e.target.value)} /></label>
            <label>Contact Number:<input type="text" value={editFormData.contactNumber || ""} onChange={(e) => handleInputChange("contactNumber", e.target.value)} /></label>
            <label>Open Hours:<input type="text" value={editFormData.openHours || ""} onChange={(e) => handleInputChange("openHours", e.target.value)} /></label>
            <label>Max Tables:<input type="number" min="1" value={editFormData.maxTables || 1} onChange={(e) => handleInputChange("maxTables", parseInt(e.target.value))} /></label>
            <label>Cuisine:<input type="text" value={editFormData.cuisine} onChange={(e) => handleInputChange("cuisine", e.target.value)} /></label>

            {/** Overview, menu, photos **/}
            <label>Overview:<textarea value={editFormData.overview || ""} onChange={(e) => handleInputChange("overview", e.target.value)} /></label>
            <label>Menu (URL or description):<textarea value={editFormData.menu || ""} onChange={(e) => handleInputChange("menu", e.target.value)} /></label>
            <label>Photos (comma-separated URLs):<input type="text" value={editFormData.photos ? editFormData.photos.join(",") : ""} onChange={(e) => handleInputChange("photos", e.target.value.split(","))} /></label>

            {/** Profile & cover pics **/}
            <label>Profile Picture URL:<input type="text" value={editFormData.profilePic || ""} onChange={(e) => handleInputChange("profilePic", e.target.value)} /></label>
            <label>Cover Photo URL:<input type="text" value={editFormData.coverPhoto || ""} onChange={(e) => handleInputChange("coverPhoto", e.target.value)} /></label>

            {/** Direction & price **/}
            <label>Direction / Map URL:<input type="text" value={editFormData.direction || ""} onChange={(e) => handleInputChange("direction", e.target.value)} /></label>
            <label>Price Range:<input type="text" value={editFormData.priceRange || ""} onChange={(e) => handleInputChange("priceRange", e.target.value)} /></label>

            <div className="edit-modal-actions">
              <button onClick={handleSaveEdit}>💾 Save Changes</button>
              <button onClick={() => setEditingRestaurant(null)}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
