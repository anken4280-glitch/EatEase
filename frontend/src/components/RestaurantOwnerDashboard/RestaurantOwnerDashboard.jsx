import React from 'react';
import './RestaurantOwnerDashboard.css';

function RestaurantOwnerDashboard({ user }) {
  const [restaurant, setRestaurant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
            <button 
              className="setup-btn"
              onClick={() => setIsEditing(true)}
            >
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
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit
              </button>
            </div>
            
            <div className="restaurant-info">
              <p><strong>Cuisine:</strong> {restaurant.cuisine || 'Not set'}</p>
              <p><strong>Address:</strong> {restaurant.address || 'Not set'}</p>
              <p><strong>Contact:</strong> {restaurant.phone || 'Not set'}</p>
              <p><strong>Current Status:</strong> 
                <span className={`status-${restaurant.status || 'unknown'}`}>
                  {restaurant.crowdLevel || 'Not monitoring yet'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick stats placeholder */}
          <div className="stats-overview">
            <h3>Today's Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">0</span>
                <span className="stat-label">Visitors Today</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">0%</span>
                <span className="stat-label">Average Occupancy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <RestaurantEditModal
          restaurant={restaurant}
          onSave={(restaurantData) => {
            setRestaurant(restaurantData);
            setIsEditing(false);
          }}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}

export default RestaurantOwnerDashboard;