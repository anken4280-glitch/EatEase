import React, { useState, useEffect } from 'react';
import { getRestaurantFeatures, updateRestaurantFeatures } from '../api';

export default function FeaturesManager() {
  const [features, setFeatures] = useState([]);
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setLoading(true);
    const data = await getRestaurantFeatures();
    setFeatures(data);
    setLoading(false);
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures(prev => [...prev, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (featureToRemove) => {
    setFeatures(prev => prev.filter(f => f !== featureToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddFeature();
    }
  };

  if (loading) {
    return (
      <div className="features-manager">
        <div className="loading">Loading features...</div>
      </div>
    );
  }

  return (
    <div className="features-manager">
      <div className="page-header">
        <h2>⭐ Restaurant Features</h2>
        <p>Manage available restaurant features and amenities</p>
      </div>

      <div className="features-section">
        <div className="add-feature">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new feature (e.g., 'Free WiFi')"
            className="feature-input"
          />
          <button 
            onClick={handleAddFeature}
            className="btn-primary"
            disabled={!newFeature.trim()}
          >
            Add Feature
          </button>
        </div>

        <div className="features-list">
          <h4>Available Features ({features.length})</h4>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-item">
                <span>{feature}</span>
                <button 
                  onClick={() => handleRemoveFeature(feature)}
                  className="remove-feature-btn"
                  title="Remove feature"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          {features.length === 0 && (
            <p className="no-features">No features added yet.</p>
          )}
        </div>
      </div>

      <div className="common-features">
        <h4>💡 Common Features to Add:</h4>
        <div className="suggestions">
          {['Outdoor Seating', 'Live Music', 'Free WiFi', 'Vegetarian Options', 
            'Vegan Options', 'Gluten-Free', 'Parking', 'Delivery', 
            'Takeout', 'Reservations', 'Wheelchair Accessible', 'Alcohol Served',
            'Happy Hour', 'Family Friendly', 'Romantic', 'Business Meetings',
            'Pet Friendly', 'Water View', 'Fireplace', 'Private Dining'].map(feature => (
            <button
              key={feature}
              onClick={() => setNewFeature(feature)}
              className="suggestion-btn"
            >
              {feature}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}