import React, { useState, useEffect } from "react";
import './FeaturesManager.css';

export default function FeaturesManager() {
  const [activeTab, setActiveTab] = useState("featured");
  const [features, setFeatures] = useState([]);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [loading, setLoading] = useState(true);

  const [featureForm, setFeatureForm] = useState({
    title: "",
    description: "",
    type: "discount",
    discountAmount: "",
    validUntil: "",
    restaurantId: "",
    image: "",
    isActive: true,
    priority: 1
  });

  // Mock data - replace with actual API calls
  const mockFeatures = [
    {
      id: 1,
      title: "Weekend Special - 50% Off",
      description: "Enjoy 50% off on all main courses every weekend!",
      type: "discount",
      discountAmount: "50%",
      validUntil: "2024-12-31",
      restaurantId: 1,
      restaurantName: "Pizza Palace",
      image: "🍕",
      isActive: true,
      priority: 1,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Happy Hour",
      description: "Buy one get one free on all drinks from 5 PM to 7 PM",
      type: "promotion",
      discountAmount: "BOGO",
      validUntil: "2024-12-31",
      restaurantId: 2,
      restaurantName: "Burger Corner",
      image: "🍔",
      isActive: true,
      priority: 2,
      createdAt: "2024-01-10"
    },
    {
      id: 3,
      title: "Family Feast",
      description: "Special family combo with 4 meals and drinks",
      type: "combo",
      discountAmount: "30%",
      validUntil: "2024-06-30",
      restaurantId: 3,
      restaurantName: "Sushi Garden",
      image: "🍣",
      isActive: true,
      priority: 3,
      createdAt: "2024-01-08"
    },
    {
      id: 4,
      title: "Weekday Lunch Special",
      description: "Quick lunch deals from 12 PM to 2 PM",
      type: "discount",
      discountAmount: "25%",
      validUntil: "2024-03-31",
      restaurantId: 4,
      restaurantName: "Taco Fiesta",
      image: "🌮",
      isActive: false,
      priority: 4,
      createdAt: "2024-01-05"
    }
  ];

  const mockRestaurants = [
    { id: 1, name: "Pizza Palace" },
    { id: 2, name: "Burger Corner" },
    { id: 3, name: "Sushi Garden" },
    { id: 4, name: "Taco Fiesta" },
    { id: 5, name: "Pasta Paradise" }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFeatures(mockFeatures);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateFeature = (e) => {
    e.preventDefault();
    const newFeature = {
      id: features.length + 1,
      ...featureForm,
      restaurantName: mockRestaurants.find(r => r.id === parseInt(featureForm.restaurantId))?.name || "Unknown",
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setFeatures(prev => [newFeature, ...prev]);
    setShowFeatureForm(false);
    setFeatureForm({
      title: "",
      description: "",
      type: "discount",
      discountAmount: "",
      validUntil: "",
      restaurantId: "",
      image: "",
      isActive: true,
      priority: 1
    });
    alert("✅ Feature created successfully!");
  };

  const handleUpdateFeature = (e) => {
    e.preventDefault();
    setFeatures(prev => prev.map(f => 
      f.id === editingFeature.id 
        ? { ...f, ...featureForm, restaurantName: mockRestaurants.find(r => r.id === parseInt(featureForm.restaurantId))?.name || "Unknown" }
        : f
    ));
    setShowFeatureForm(false);
    setEditingFeature(null);
    alert("✅ Feature updated successfully!");
  };

  const handleDeleteFeature = (id) => {
    if (window.confirm("Are you sure you want to delete this feature?")) {
      setFeatures(prev => prev.filter(f => f.id !== id));
      alert("✅ Feature deleted successfully!");
    }
  };

  const handleToggleFeature = (id) => {
    setFeatures(prev => prev.map(f => 
      f.id === id ? { ...f, isActive: !f.isActive } : f
    ));
  };

  const activeFeatures = features.filter(f => f.isActive);
  const expiredFeatures = features.filter(f => new Date(f.validUntil) < new Date());
  const upcomingFeatures = features.filter(f => new Date(f.validUntil) >= new Date());

  const FeatureCard = ({ feature, onEdit, onDelete, onToggle }) => (
    <div className={`feature-card ${!feature.isActive ? 'inactive' : ''}`}>
      <div className="feature-header">
        <div className="feature-icon">
          {feature.image}
        </div>
        <div className="feature-title">
          <h4>{feature.title}</h4>
          <span className={`feature-type ${feature.type}`}>
            {feature.type}
          </span>
        </div>
        <div className="feature-actions">
          <button 
            className={`status-toggle ${feature.isActive ? 'active' : 'inactive'}`}
            onClick={() => onToggle(feature.id)}
          >
            {feature.isActive ? '🟢' : '⚫'}
          </button>
          <button 
            className="btn-edit"
            onClick={() => onEdit(feature)}
          >
            ✏️
          </button>
          <button 
            className="btn-delete"
            onClick={() => onDelete(feature.id)}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="feature-content">
        <p>{feature.description}</p>
        <div className="feature-details">
          <div className="detail-item">
            <span className="label">Discount:</span>
            <span className="value discount">{feature.discountAmount}</span>
          </div>
          <div className="detail-item">
            <span className="label">Restaurant:</span>
            <span className="value">{feature.restaurantName}</span>
          </div>
          <div className="detail-item">
            <span className="label">Valid Until:</span>
            <span className="value">{new Date(feature.validUntil).toLocaleDateString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Priority:</span>
            <span className="value">#{feature.priority}</span>
          </div>
        </div>
      </div>

      <div className="feature-footer">
        <span className={`status-badge ${feature.isActive ? 'active' : 'inactive'}`}>
          {feature.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className="created-date">
          Added: {new Date(feature.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  const StatsCard = ({ title, value, icon, color }) => (
    <div className="stats-card">
      <div className="stats-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="stats-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="features-manager">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading Features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="features-manager">
      {/* Header */}
      <div className="features-header">
        <div className="header-content">
          <h1>⭐ Featured Events & Promotions</h1>
          <p>Manage discounts, promotions, and special events</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingFeature(null);
              setFeatureForm({
                title: "",
                description: "",
                type: "discount",
                discountAmount: "",
                validUntil: "",
                restaurantId: "",
                image: "",
                isActive: true,
                priority: features.length + 1
              });
              setShowFeatureForm(true);
            }}
          >
            + Create New Feature
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <StatsCard
          title="Active Features"
          value={activeFeatures.length}
          icon="🎯"
          color="#3B82F6"
        />
        <StatsCard
          title="Total Features"
          value={features.length}
          icon="⭐"
          color="#10B981"
        />
        <StatsCard
          title="Upcoming"
          value={upcomingFeatures.length}
          icon="📅"
          color="#F59E0B"
        />
        <StatsCard
          title="Expired"
          value={expiredFeatures.length}
          icon="⏰"
          color="#EF4444"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="features-tabs">
        <button 
          className={`tab-btn ${activeTab === 'featured' ? 'active' : ''}`}
          onClick={() => setActiveTab('featured')}
        >
          🎯 All Features ({features.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          ✅ Active ({activeFeatures.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          📅 Upcoming ({upcomingFeatures.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
          onClick={() => setActiveTab('expired')}
        >
          ⏰ Expired ({expiredFeatures.length})
        </button>
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        {(activeTab === 'featured' ? features :
          activeTab === 'active' ? activeFeatures :
          activeTab === 'upcoming' ? upcomingFeatures :
          expiredFeatures).map(feature => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onEdit={(feature) => {
              setEditingFeature(feature);
              setFeatureForm({
                title: feature.title,
                description: feature.description,
                type: feature.type,
                discountAmount: feature.discountAmount,
                validUntil: feature.validUntil,
                restaurantId: feature.restaurantId.toString(),
                image: feature.image,
                isActive: feature.isActive,
                priority: feature.priority
              });
              setShowFeatureForm(true);
            }}
            onDelete={handleDeleteFeature}
            onToggle={handleToggleFeature}
          />
        ))}
      </div>

      {features.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>No Features Yet</h3>
          <p>Create your first featured event or promotion to get started!</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowFeatureForm(true)}
          >
            Create First Feature
          </button>
        </div>
      )}

      {/* Feature Form Modal */}
      {showFeatureForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingFeature ? 'Edit Feature' : 'Create New Feature'}</h3>
            <form onSubmit={editingFeature ? handleUpdateFeature : handleCreateFeature}>
              <div className="form-grid">
                <label>
                  Feature Title:
                  <input
                    type="text"
                    value={featureForm.title}
                    onChange={(e) => setFeatureForm({...featureForm, title: e.target.value})}
                    placeholder="e.g., Weekend Special - 50% Off"
                    required
                  />
                </label>

                <label>
                  Description:
                  <textarea
                    value={featureForm.description}
                    onChange={(e) => setFeatureForm({...featureForm, description: e.target.value})}
                    placeholder="Describe the promotion or event..."
                    required
                  />
                </label>

                <label>
                  Type:
                  <select
                    value={featureForm.type}
                    onChange={(e) => setFeatureForm({...featureForm, type: e.target.value})}
                  >
                    <option value="discount">Discount</option>
                    <option value="promotion">Promotion</option>
                    <option value="combo">Combo Deal</option>
                    <option value="event">Special Event</option>
                    <option value="happyhour">Happy Hour</option>
                  </select>
                </label>

                <label>
                  Discount/Promo:
                  <input
                    type="text"
                    value={featureForm.discountAmount}
                    onChange={(e) => setFeatureForm({...featureForm, discountAmount: e.target.value})}
                    placeholder="e.g., 50%, BOGO, $10 OFF"
                    required
                  />
                </label>

                <label>
                  Restaurant:
                  <select
                    value={featureForm.restaurantId}
                    onChange={(e) => setFeatureForm({...featureForm, restaurantId: e.target.value})}
                    required
                  >
                    <option value="">Select Restaurant</option>
                    {mockRestaurants.map(restaurant => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Valid Until:
                  <input
                    type="date"
                    value={featureForm.validUntil}
                    onChange={(e) => setFeatureForm({...featureForm, validUntil: e.target.value})}
                    required
                  />
                </label>

                <label>
                  Icon/Emoji:
                  <input
                    type="text"
                    value={featureForm.image}
                    onChange={(e) => setFeatureForm({...featureForm, image: e.target.value})}
                    placeholder="e.g., 🍕, 🍔, 🎉"
                    maxLength="2"
                  />
                </label>

                <label>
                  Priority:
                  <input
                    type="number"
                    value={featureForm.priority}
                    onChange={(e) => setFeatureForm({...featureForm, priority: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                    required
                  />
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={featureForm.isActive}
                    onChange={(e) => setFeatureForm({...featureForm, isActive: e.target.checked})}
                  />
                  Active Feature
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingFeature ? 'Update Feature' : 'Create Feature'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowFeatureForm(false);
                    setEditingFeature(null);
                  }}
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