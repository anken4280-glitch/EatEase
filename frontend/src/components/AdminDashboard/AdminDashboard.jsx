import React, { useState, useEffect } from "react";
import { fetchRestaurants, updateRestaurantStatus, updateRestaurant } from "../../api";
import PopularTimesChart from "../PopularTimesChart/PopularTimesChart";
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingField, setEditingField] = useState(null);

  const [newPromotion, setNewPromotion] = useState({
    title: "",
    description: "",
    discount: "",
    validUntil: ""
  });

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    cuisine: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    openingTime: "09:00",
    closingTime: "22:00",
    maxOccupancy: 100,
    tables: 20,
    coverImage: "",
    profileImage: "",
    menuItems: [],
    photos: [],
    coordinates: { lat: 0, lng: 0 },
    direction: ""
  });

  const [newMenuItems, setNewMenuItems] = useState({
    name: "",
    price: "",
    category: "Main Course",
    description: ""
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

  const handleUpdateRestaurant = async (field = null, value = null) => {
    try {
      let updateData;
      
      if (field && value !== null) {
        // Single field update
        updateData = { [field]: value };
      } else {
        // Full form update
        updateData = restaurantForm;
      }

      const result = await updateRestaurant(selectedRestaurant.id, updateData);
      
      if (result.success) {
        alert("✅ Restaurant updated successfully!");
        setRestaurants(prev => prev.map(r => 
          r.id === selectedRestaurant.id ? result.restaurant : r
        ));
        setSelectedRestaurant(result.restaurant);
        
        if (field) {
          setEditingField(null); // Close inline edit
        } else {
          setShowRestaurantForm(false); // Close full form
        }
      }
    } catch (error) {
      console.error("Error updating restaurant:", error);
      alert("❌ Failed to update restaurant");
    }
  };

  // Quick Edit Functions
  const startEditing = (field, value) => {
    setEditingField(field);
    setRestaurantForm(prev => ({ ...prev, [field]: value }));
  };

  const saveQuickEdit = (field) => {
    handleUpdateRestaurant(field, restaurantForm[field]);
  };

  const cancelEdit = () => {
    setEditingField(null);
    // Reset form to current restaurant data
    if (selectedRestaurant) {
      setRestaurantForm({
        name: selectedRestaurant.name || "",
        cuisine: selectedRestaurant.cuisine || "",
        description: selectedRestaurant.description || "A wonderful dining experience",
        address: selectedRestaurant.address || "123 Main Street",
        phone: selectedRestaurant.phone || "(555) 123-4567",
        email: selectedRestaurant.email || "contact@restaurant.com",
        website: selectedRestaurant.website || "https://restaurant.com",
        openingTime: selectedRestaurant.openingTime || "09:00",
        closingTime: selectedRestaurant.closingTime || "22:00",
        maxOccupancy: selectedRestaurant.maxOccupancy || 100,
        tables: selectedRestaurant.tables || 20,
        coverImage: selectedRestaurant.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        profileImage: selectedRestaurant.profileImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
        menuItems: selectedRestaurant.menuItems || ["Margherita Pizza - $12", "Caesar Salad - $8"],
        photos: selectedRestaurant.photos || [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400"
        ],
        coordinates: selectedRestaurant.coordinates || { lat: 40.7128, lng: -74.0060 },
        direction: selectedRestaurant.direction || "Located in the heart of downtown, next to Central Park"
      });
    }
  };

  // Menu Management
  const addMenuItem = (e) => {
    e.preventDefault();
    if (newMenuItems.name && newMenuItems.price) {
      const newItem = `${newMenuItems.name} - $${newMenuItems.price}`;
      const updatedMenuItems = [...restaurantForm.menuItems, newItem];
      setRestaurantForm(prev => ({ ...prev, menuItems: updatedMenuItems }));
      setNewMenuItems({ name: "", price: "", category: "Main Course", description: "" });
      handleUpdateRestaurant('menuItems', updatedMenuItems);
    }
  };

  const removeMenuItem = (index) => {
    const updatedMenuItems = restaurantForm.menuItems.filter((_, i) => i !== index);
    setRestaurantForm(prev => ({ ...prev, menuItems: updatedMenuItems }));
    handleUpdateRestaurant('menuItems', updatedMenuItems);
  };

  // Photo Management
  const addPhoto = () => {
    const photoUrl = prompt("Enter photo URL:");
    if (photoUrl) {
      const updatedPhotos = [...restaurantForm.photos, photoUrl];
      setRestaurantForm(prev => ({ ...prev, photos: updatedPhotos }));
      handleUpdateRestaurant('photos', updatedPhotos);
    }
  };

  const removePhoto = (index) => {
    const updatedPhotos = restaurantForm.photos.filter((_, i) => i !== index);
    setRestaurantForm(prev => ({ ...prev, photos: updatedPhotos }));
    handleUpdateRestaurant('photos', updatedPhotos);
  };

  // Direction/Location
  const updateDirection = () => {
    const newDirection = prompt("Enter directions:", restaurantForm.direction);
    if (newDirection !== null) {
      setRestaurantForm(prev => ({ ...prev, direction: newDirection }));
      handleUpdateRestaurant('direction', newDirection);
    }
  };

  const openGoogleMaps = () => {
    if (selectedRestaurant?.address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRestaurant.address)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  // Initialize form when restaurant is selected
  useEffect(() => {
    if (selectedRestaurant) {
      setRestaurantForm({
        name: selectedRestaurant.name || "",
        cuisine: selectedRestaurant.cuisine || "",
        description: selectedRestaurant.description || "A wonderful dining experience",
        address: selectedRestaurant.address || "123 Main Street",
        phone: selectedRestaurant.phone || "(555) 123-4567",
        email: selectedRestaurant.email || "contact@restaurant.com",
        website: selectedRestaurant.website || "https://restaurant.com",
        openingTime: selectedRestaurant.openingTime || "09:00",
        closingTime: selectedRestaurant.closingTime || "22:00",
        maxOccupancy: selectedRestaurant.maxOccupancy || 100,
        tables: selectedRestaurant.tables || 20,
        coverImage: selectedRestaurant.coverImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        profileImage: selectedRestaurant.profileImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
        menuItems: selectedRestaurant.menuItems || ["Margherita Pizza - $12", "Caesar Salad - $8"],
        photos: selectedRestaurant.photos || [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400"
        ],
        coordinates: selectedRestaurant.coordinates || { lat: 40.7128, lng: -74.0060 },
        direction: selectedRestaurant.direction || "Located in the heart of downtown, next to Central Park"
      });
    }
  }, [selectedRestaurant]);

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
          {/* Cover Image and Profile Section */}
          <div className="restaurant-header">
            <div 
              className="cover-image"
              style={{ backgroundImage: `url(${restaurantForm.coverImage})` }}
            >
              <div className="cover-overlay">
                <button 
                  className="edit-cover-btn"
                  onClick={() => startEditing('coverImage', restaurantForm.coverImage)}
                >
                  📸 Edit Cover
                </button>
              </div>
              <div className="profile-section">
                <div className="profile-image-container">
                  <img 
                    src={restaurantForm.profileImage} 
                    alt={selectedRestaurant.name}
                    className="profile-image"
                  />
                  <button 
                    className="edit-profile-image-btn"
                    onClick={() => startEditing('profileImage', restaurantForm.profileImage)}
                  >
                    📷
                  </button>
                </div>
                <div className="profile-info">
                  {editingField === 'name' ? (
                    <div className="inline-edit">
                      <input
                        type="text"
                        value={restaurantForm.name}
                        onChange={(e) => setRestaurantForm(prev => ({ ...prev, name: e.target.value }))}
                        className="edit-input"
                      />
                      <button onClick={() => saveQuickEdit('name')}>✅</button>
                      <button onClick={cancelEdit}>❌</button>
                    </div>
                  ) : (
                    <h1 onClick={() => startEditing('name', restaurantForm.name)}>
                      {selectedRestaurant.name} <span className="edit-icon">✏️</span>
                    </h1>
                  )}
                  
                  {editingField === 'cuisine' ? (
                    <div className="inline-edit">
                      <input
                        type="text"
                        value={restaurantForm.cuisine}
                        onChange={(e) => setRestaurantForm(prev => ({ ...prev, cuisine: e.target.value }))}
                        className="edit-input"
                      />
                      <button onClick={() => saveQuickEdit('cuisine')}>✅</button>
                      <button onClick={cancelEdit}>❌</button>
                    </div>
                  ) : (
                    <p 
                      className="cuisine-badge"
                      onClick={() => startEditing('cuisine', restaurantForm.cuisine)}
                    >
                      {selectedRestaurant.cuisine} <span className="edit-icon">✏️</span>
                    </p>
                  )}
                  
                  <button 
                    className="edit-profile-btn"
                    onClick={() => setShowRestaurantForm(true)}
                  >
                    ✏️ Full Edit Mode
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="dashboard-tabs">
            <button 
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              📊 Overview
            </button>
            <button 
              className={activeTab === "menu" ? "active" : ""}
              onClick={() => setActiveTab("menu")}
            >
              📋 Menu
            </button>
            <button 
              className={activeTab === "photos" ? "active" : ""}
              onClick={() => setActiveTab("photos")}
            >
              🖼️ Photos
            </button>
            <button 
              className={activeTab === "location" ? "active" : ""}
              onClick={() => setActiveTab("location")}
            >
              📍 Location
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="tab-content">
              <div className="overview-grid">
                {/* Left Column - Basic Info */}
                <div className="info-card">
                  <h3>📋 Restaurant Information</h3>
                  <div className="info-grid">
                    {/* Editable Contact Information */}
                    <div className="info-item editable">
                      <strong>Contact Number:</strong>
                      {editingField === 'phone' ? (
                        <div className="inline-edit">
                          <input
                            type="text"
                            value={restaurantForm.phone}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="edit-input"
                          />
                          <button onClick={() => saveQuickEdit('phone')}>✅</button>
                          <button onClick={cancelEdit}>❌</button>
                        </div>
                      ) : (
                        <span onClick={() => startEditing('phone', restaurantForm.phone)}>
                          {restaurantForm.phone} <span className="edit-icon">✏️</span>
                        </span>
                      )}
                    </div>

                    <div className="info-item editable">
                      <strong>Email:</strong>
                      {editingField === 'email' ? (
                        <div className="inline-edit">
                          <input
                            type="email"
                            value={restaurantForm.email}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, email: e.target.value }))}
                            className="edit-input"
                          />
                          <button onClick={() => saveQuickEdit('email')}>✅</button>
                          <button onClick={cancelEdit}>❌</button>
                        </div>
                      ) : (
                        <span onClick={() => startEditing('email', restaurantForm.email)}>
                          {restaurantForm.email} <span className="edit-icon">✏️</span>
                        </span>
                      )}
                    </div>

                    <div className="info-item editable">
                      <strong>Website:</strong>
                      {editingField === 'website' ? (
                        <div className="inline-edit">
                          <input
                            type="url"
                            value={restaurantForm.website}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, website: e.target.value }))}
                            className="edit-input"
                          />
                          <button onClick={() => saveQuickEdit('website')}>✅</button>
                          <button onClick={cancelEdit}>❌</button>
                        </div>
                      ) : (
                        <a 
                          href={restaurantForm.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            startEditing('website', restaurantForm.website);
                          }}
                        >
                          {restaurantForm.website} <span className="edit-icon">✏️</span>
                        </a>
                      )}
                    </div>

                    {/* Editable Hours */}
                    <div className="info-item editable">
                      <strong>Opening Hours:</strong>
                      {editingField === 'openingTime' ? (
                        <div className="inline-edit time-edit">
                          <input
                            type="time"
                            value={restaurantForm.openingTime}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, openingTime: e.target.value }))}
                          />
                          <span> to </span>
                          <input
                            type="time"
                            value={restaurantForm.closingTime}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, closingTime: e.target.value }))}
                          />
                          <button onClick={() => {
                            handleUpdateRestaurant('openingTime', restaurantForm.openingTime);
                            handleUpdateRestaurant('closingTime', restaurantForm.closingTime);
                          }}>✅</button>
                          <button onClick={cancelEdit}>❌</button>
                        </div>
                      ) : (
                        <span onClick={() => setEditingField('openingTime')}>
                          {restaurantForm.openingTime} - {restaurantForm.closingTime} <span className="edit-icon">✏️</span>
                        </span>
                      )}
                    </div>

                    {/* Editable Capacity */}
                    <div className="info-item editable">
                      <strong>Max Occupancy:</strong>
                      {editingField === 'maxOccupancy' ? (
                        <div className="inline-edit">
                          <input
                            type="number"
                            value={restaurantForm.maxOccupancy}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, maxOccupancy: parseInt(e.target.value) }))}
                            className="edit-input"
                          />
                          <span>people</span>
                          <button onClick={() => saveQuickEdit('maxOccupancy')}>✅</button>
                          <button onClick={cancelEdit}>❌</button>
                        </div>
                      ) : (
                        <span onClick={() => startEditing('maxOccupancy', restaurantForm.maxOccupancy)}>
                          {restaurantForm.maxOccupancy} people <span className="edit-icon">✏️</span>
                        </span>
                      )}
                    </div>

                    <div className="info-item editable">
                      <strong>Number of Tables:</strong>
                      {editingField === 'tables' ? (
                        <div className="inline-edit">
                          <input
                            type="number"
                            value={restaurantForm.tables}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, tables: parseInt(e.target.value) }))}
                            className="edit-input"
                          />
                          <span>tables</span>
                          <button onClick={() => saveQuickEdit('tables')}>✅</button>
                          <button onClick={cancelEdit}>❌</button>
                        </div>
                      ) : (
                        <span onClick={() => startEditing('tables', restaurantForm.tables)}>
                          {restaurantForm.tables} tables <span className="edit-icon">✏️</span>
                        </span>
                      )}
                    </div>

                    {/* Overview/Description */}
                    <div className="info-item editable full-width">
                      <strong>Overview:</strong>
                      {editingField === 'description' ? (
                        <div className="inline-edit">
                          <textarea
                            value={restaurantForm.description}
                            onChange={(e) => setRestaurantForm(prev => ({ ...prev, description: e.target.value }))}
                            className="edit-textarea"
                            rows="3"
                          />
                          <div className="edit-actions">
                            <button onClick={() => saveQuickEdit('description')}>✅ Save</button>
                            <button onClick={cancelEdit}>❌ Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p 
                          onClick={() => startEditing('description', restaurantForm.description)}
                          className="editable-text"
                        >
                          {restaurantForm.description} <span className="edit-icon">✏️</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Status & Analytics */}
                <div className="status-section">
                  <div className="current-status">
                    <h4>Current Status</h4>
                    <p className={`status-badge status-${selectedRestaurant.status}`}>
                      {selectedRestaurant.status.toUpperCase()} ({selectedRestaurant.crowdLevel})
                    </p>
                    <div className="status-details">
                      <p>Occupancy: {selectedRestaurant.occupancy}%</p>
                      <p>Wait Time: {selectedRestaurant.waitTime} min</p>
                    </div>
                  </div>

                  {/* Status Controls */}
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

                  {/* Promotion Management */}
                  <div className="promotion-section">
                    <h4>Promotion Management</h4>
                    <button 
                      className="create-promo-btn"
                      onClick={() => setShowPromotionForm(true)}
                    >
                      🎯 CREATE PROMOTION
                    </button>
                  </div>
                </div>
              </div>

              {/* Popular Times Analytics */}
              <div className="analytics-section">
                <h4>Popular Times Analytics</h4>
                <PopularTimesChart restaurant={selectedRestaurant} currentTime={new Date()} />
              </div>
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === "menu" && (
            <div className="tab-content">
              <div className="menu-management">
                <div className="menu-header">
                  <h3>📋 Menu Management</h3>
                  <div className="menu-form">
                    <h4>Add New Menu Item</h4>
                    <form onSubmit={addMenuItem} className="menu-item-form">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={newMenuItems.name}
                        onChange={(e) => setNewMenuItems(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        value={newMenuItems.price}
                        onChange={(e) => setNewMenuItems(prev => ({ ...prev, price: e.target.value }))}
                        required
                      />
                      <select
                        value={newMenuItems.category}
                        onChange={(e) => setNewMenuItems(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="Appetizer">Appetizer</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Dessert">Dessert</option>
                        <option value="Beverage">Beverage</option>
                      </select>
                      <button type="submit" className="btn-primary">Add Item</button>
                    </form>
                  </div>
                </div>
                <div className="menu-items">
                  <h4>Current Menu Items</h4>
                  {restaurantForm.menuItems.map((item, index) => (
                    <div key={index} className="menu-item">
                      <span>{item}</span>
                      <button 
                        className="btn-danger"
                        onClick={() => removeMenuItem(index)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                  {restaurantForm.menuItems.length === 0 && (
                    <p className="no-items">No menu items added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === "photos" && (
            <div className="tab-content">
              <div className="photos-management">
                <div className="photos-header">
                  <h3>🖼️ Photo Gallery</h3>
                  <button className="btn-primary" onClick={addPhoto}>
                    + Add Photo
                  </button>
                </div>
                <div className="photos-grid">
                  {restaurantForm.photos.map((photo, index) => (
                    <div key={index} className="photo-item">
                      <img src={photo} alt={`Restaurant photo ${index + 1}`} />
                      <button 
                        className="btn-danger"
                        onClick={() => removePhoto(index)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                  {restaurantForm.photos.length === 0 && (
                    <p className="no-items">No photos added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location Tab */}
          {activeTab === "location" && (
            <div className="tab-content">
              <div className="location-management">
                <div className="location-info">
                  <h3>📍 Location & Directions</h3>
                  
                  {/* Address */}
                  <div className="address-card">
                    <strong>Address:</strong>
                    {editingField === 'address' ? (
                      <div className="inline-edit">
                        <input
                          type="text"
                          value={restaurantForm.address}
                          onChange={(e) => setRestaurantForm(prev => ({ ...prev, address: e.target.value }))}
                          className="edit-input"
                        />
                        <button onClick={() => saveQuickEdit('address')}>✅</button>
                        <button onClick={cancelEdit}>❌</button>
                      </div>
                    ) : (
                      <p onClick={() => startEditing('address', restaurantForm.address)}>
                        {restaurantForm.address} <span className="edit-icon">✏️</span>
                      </p>
                    )}
                    <button className="btn-primary" onClick={openGoogleMaps}>
                      🗺️ Open in Google Maps
                    </button>
                  </div>

                  {/* Directions */}
                  <div className="directions-card">
                    <div className="directions-header">
                      <strong>Directions:</strong>
                      <button className="btn-secondary" onClick={updateDirection}>
                        ✏️ Edit Directions
                      </button>
                    </div>
                    <p>{restaurantForm.direction}</p>
                  </div>
                  
                  {/* Map */}
                  <div className="map-placeholder">
                    <div className="map-container">
                      <p>📍 Map Location</p>
                      <p className="map-coordinates">
                        Coordinates: {restaurantForm.coordinates.lat.toFixed(4)}, {restaurantForm.coordinates.lng.toFixed(4)}
                      </p>
                      <div className="map-actions">
                        <button className="btn-secondary">
                          Set Custom Coordinates
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Promotion Form Modal */}
      {showPromotionForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create New Promotion</h3>
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

      {/* Full Restaurant Edit Modal */}
      {showRestaurantForm && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <h3>Edit Restaurant Profile</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateRestaurant(); }}>
              <div className="form-grid">
                <label>
                  Restaurant Name:
                  <input
                    type="text"
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Cuisine Type:
                  <input
                    type="text"
                    value={restaurantForm.cuisine}
                    onChange={(e) => setRestaurantForm({...restaurantForm, cuisine: e.target.value})}
                    required
                  />
                </label>
                <label className="full-width">
                  Description:
                  <textarea
                    value={restaurantForm.description}
                    onChange={(e) => setRestaurantForm({...restaurantForm, description: e.target.value})}
                    rows="4"
                  />
                </label>
                <label className="full-width">
                  Address:
                  <input
                    type="text"
                    value={restaurantForm.address}
                    onChange={(e) => setRestaurantForm({...restaurantForm, address: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Phone:
                  <input
                    type="text"
                    value={restaurantForm.phone}
                    onChange={(e) => setRestaurantForm({...restaurantForm, phone: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Email:
                  <input
                    type="email"
                    value={restaurantForm.email}
                    onChange={(e) => setRestaurantForm({...restaurantForm, email: e.target.value})}
                  />
                </label>
                <label>
                  Website:
                  <input
                    type="url"
                    value={restaurantForm.website}
                    onChange={(e) => setRestaurantForm({...restaurantForm, website: e.target.value})}
                  />
                </label>
                <label>
                  Opening Time:
                  <input
                    type="time"
                    value={restaurantForm.openingTime}
                    onChange={(e) => setRestaurantForm({...restaurantForm, openingTime: e.target.value})}
                  />
                </label>
                <label>
                  Closing Time:
                  <input
                    type="time"
                    value={restaurantForm.closingTime}
                    onChange={(e) => setRestaurantForm({...restaurantForm, closingTime: e.target.value})}
                  />
                </label>
                <label>
                  Max Occupancy:
                  <input
                    type="number"
                    value={restaurantForm.maxOccupancy}
                    onChange={(e) => setRestaurantForm({...restaurantForm, maxOccupancy: parseInt(e.target.value)})}
                  />
                </label>
                <label>
                  Number of Tables:
                  <input
                    type="number"
                    value={restaurantForm.tables}
                    onChange={(e) => setRestaurantForm({...restaurantForm, tables: parseInt(e.target.value)})}
                  />
                </label>
                <label>
                  Cover Image URL:
                  <input
                    type="url"
                    value={restaurantForm.coverImage}
                    onChange={(e) => setRestaurantForm({...restaurantForm, coverImage: e.target.value})}
                  />
                </label>
                <label>
                  Profile Image URL:
                  <input
                    type="url"
                    value={restaurantForm.profileImage}
                    onChange={(e) => setRestaurantForm({...restaurantForm, profileImage: e.target.value})}
                  />
                </label>
                <label className="full-width">
                  Directions:
                  <textarea
                    value={restaurantForm.direction}
                    onChange={(e) => setRestaurantForm({...restaurantForm, direction: e.target.value})}
                    rows="3"
                    placeholder="Provide directions to your restaurant..."
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Update Restaurant
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowRestaurantForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}