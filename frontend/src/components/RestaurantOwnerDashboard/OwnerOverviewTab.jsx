import React from 'react';

const OwnerOverviewTab = ({ restaurant, onEdit }) => {
  return (
    <div className="owner-overview-tab">
      <div className="tab-section">
        <div className="section-header">
          <h3>📍 Location & Contact</h3>
        </div>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Address:</span>
            <span className="info-value">{restaurant.address}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone:</span>
            <span className="info-value">{restaurant.phone}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Hours:</span>
            <span className="info-value">{restaurant.hours}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cuisine:</span>
            <span className="info-value">{restaurant.cuisine_type}</span>
          </div>
        </div>
      </div>

      <div className="tab-section">
        <div className="section-header">
          <h3>✨ Features & Amenities</h3>
        </div>
        
        {restaurant.features && restaurant.features.length > 0 ? (
          <div className="features-list">
            {restaurant.features.map((feature, index) => (
              <span key={index} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        ) : (
          <p className="no-features">No features added yet.</p>
        )}
      </div>

      <div className="tab-section">
        <div className="section-header">
          <h3>Current Status</h3>
          <button className="section-edit-btn" onClick={onEdit}>
           Update Status
          </button>
        </div>
        
        <div className="status-info">
          <div className="status-item">
            <span className="status-label">Crowd Level:</span>
            <span className={`status-value status-${restaurant.crowd_status}`}>
              {restaurant.crowd_status === 'green' ? 'Low' : 
               restaurant.crowd_status === 'yellow' ? 'Moderate' : 
               restaurant.crowd_status === 'orange' ? 'Busy' : 'Very High'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Capacity:</span>
            <span className="status-value">
              {restaurant.current_occupancy}/{restaurant.max_capacity} people
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Occupancy:</span>
            <span className="status-value">{restaurant.occupancy_percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerOverviewTab;