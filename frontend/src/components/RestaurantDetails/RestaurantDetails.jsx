import React, { useState, useEffect } from 'react';
import './RestaurantDetails.css';

// Tab Components
import OverviewTab from '../OverviewTab/OverviewTab';
import MenuTab from '../MenuTab/MenuTab';
import ReviewsTab from '../ReviewsTab/ReviewsTab';
import PhotosTab from '../PhotosTab/PhotosTab';

function RestaurantDetails({ restaurantId, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null); // CRITICAL: Add this line
  
  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails();
    } else {
      setError('No restaurant ID provided');
      setLoading(false);
    }
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    try {
      setError(null);
      
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      // EXTRACT THE RESTAURANT OBJECT FROM THE RESPONSE
      const data = result.restaurant || result;
      
      // Transform data to match expected field names
      const transformedData = {
        id: data.id || restaurantId,
        name: data.name || 'Unknown Restaurant',
        cuisine_type: data.cuisine || data.cuisine_type || 'Not specified',
        address: data.address || 'Address not available',
        phone: data.phone || 'No phone number',
        hours: data.hours || 'Hours not specified',
        max_capacity: data.max_capacity || data.capacity || 50,
        current_occupancy: data.current_occupancy || data.occupancy || 0,
        occupancy_percentage: data.occupancy || data.occupancy_percentage || 
                             Math.round(((data.current_occupancy || 0) / (data.max_capacity || 50) * 100)),
        crowd_status: data.status || data.crowd_status || 'green',
        crowd_level: data.crowdLevel || 'Low',
        is_verified: data.is_verified || false,
        is_featured: data.isFeatured || data.is_featured || false,
        features: data.features || [],
      };
      
      console.log('Transformed data:', transformedData);
      setRestaurant(transformedData);
      
      // Fetch stats
      try {
        const statsResponse = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (statsError) {
        console.log('Stats using defaults');
        setStats({
          average_rating: 0,
          total_reviews: 0,
          menu_items_count: 0,
          photos_count: 0,
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      setError('Failed to load restaurant details');
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (!restaurant) return null;
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab restaurant={restaurant} stats={stats} />;
      case 'menu':
        return <MenuTab restaurantId={restaurantId} />;
      case 'reviews':
        return <ReviewsTab restaurantId={restaurantId} restaurantName={restaurant.name} />;
      case 'photos':
        return <PhotosTab restaurantId={restaurantId} />;
      default:
        return <OverviewTab restaurant={restaurant} stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="restaurant-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="restaurant-details-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Restaurant</h3>
          <p>{error || 'Restaurant not found'}</p>
          <button onClick={onBack} className="retry-btn">Go Back</button>
        </div>
      </div>
    );
  }

  // Calculate crowd status text
  const getCrowdStatusText = (status) => {
    switch(status) {
      case 'green': return '😊 Low Crowd';
      case 'yellow': return '😐 Moderate';
      case 'orange': return '😟 Busy';
      case 'red': return '😖 Very High';
      default: return 'Unknown';
    }
  };

  return (
    <div className="restaurant-details-page">
      {/* Restaurant Header */}
      <div className="restaurant-header">
        <div className="restaurant-image-container">
          <div className="restaurant-image-placeholder">
            {restaurant.is_verified && (
              <span className="verified-badge">✅ Verified</span>
            )}
            <div className="image-fallback">
              <span className="restaurant-icon">🍽️</span>
            </div>
          </div>
        </div>

        <div className="restaurant-basic-info">
          <h1 className="restaurant-name">{restaurant.name}</h1>
          <div className="restaurant-meta">
            <span className={`crowd-status ${restaurant.crowd_status}`}>
              {getCrowdStatusText(restaurant.crowd_status)}
            </span>
            <span className="occupancy-rate">
              {restaurant.occupancy_percentage}% occupied
            </span>
          </div>
          <p className="cuisine-type">{restaurant.cuisine_type}</p>
          
          {stats && (
            <div className="rating-summary">
              <span className="average-rating">⭐ {stats.average_rating || 'N/A'}</span>
              <span className="review-count">({stats.total_reviews || 0} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="stat-item">
          <span className="stat-value">{restaurant.current_occupancy}/{restaurant.max_capacity}</span>
          <span className="stat-label">Capacity</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{restaurant.crowd_status}</span>
          <span className="stat-label">Status</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">
            {restaurant.is_featured ? '🌟' : '⭐'}
          </span>
          <span className="stat-label">
            {restaurant.is_featured ? 'Featured' : 'Standard'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
          {stats && stats.total_reviews > 0 && (
            <span className="tab-badge">{stats.total_reviews}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          Photos
          {stats && stats.photos_count > 0 && (
            <span className="tab-badge">{stats.photos_count}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Action Buttons (Fixed at Bottom for Mobile) */}
      <div className="action-bar">
        <button className="action-btn directions-btn">
          <span className="btn-icon">📍</span>
          Directions
        </button>
        <button className="action-btn bookmark-btn">
          <span className="btn-icon">⭐</span>
          Bookmark
        </button>
        <button className="action-btn notify-btn">
          <span className="btn-icon">🔔</span>
          Notify Me
        </button>
      </div>
    </div>
  );
}

export default RestaurantDetails;