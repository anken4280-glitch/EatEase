import React, { useState, useEffect } from 'react';
import './RestaurantCard.css';

function RestaurantCard({ restaurant, onRestaurantClick }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userHasNotification, setUserHasNotification] = useState(null);

  // Check if restaurant is already bookmarked & has notification on load
  useEffect(() => {
    checkUserPreferences();
  }, [restaurant.id]);

  const checkUserPreferences = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      // Check bookmarks
      const bookmarksRes = await fetch('http://localhost:8000/api/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const bookmarksData = await bookmarksRes.json();
      if (bookmarksData.success && bookmarksData.bookmarks) {
        const bookmarked = bookmarksData.bookmarks.some(b => b.restaurant_id === restaurant.id);
        setIsBookmarked(bookmarked);
      }

      // Check notifications
      const notificationsRes = await fetch('http://localhost:8000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const notificationsData = await notificationsRes.json();
      if (notificationsData.success && notificationsData.notifications) {
        const notification = notificationsData.notifications.find(n => n.restaurant_id === restaurant.id);
        setUserHasNotification(notification?.notify_when_status || null);
      }
    } catch (error) {
      console.error('Error checking preferences:', error);
    }
  };

  const handleClick = () => {
    onRestaurantClick(restaurant);
  };

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    setLoading(true);
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Please login to bookmark restaurants');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/bookmarks/${restaurant.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setIsBookmarked(data.isBookmarked);
        // Optional: Show subtle feedback
        console.log(data.message);
      } else {
        console.error('Bookmark failed:', data.message);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      alert('Failed to update bookmark. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      alert('Please login to set notifications');
      return;
    }
    
    setShowNotificationModal(true);
  };

  const handleSetNotification = async (crowdLevel) => {
    const token = localStorage.getItem('auth_token');
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${restaurant.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ notify_when_status: crowdLevel })
      });
      
      const data = await response.json();
      if (data.success) {
        setUserHasNotification(crowdLevel);
        alert(`✅ You'll be notified when ${restaurant.name} has ${getStatusText(crowdLevel)} crowd!`);
        setShowNotificationModal(false);
      } else {
        alert('Failed to set notification: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Notification error:', error);
      alert('Failed to set notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNotification = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setLoading(true);
    try {
      // First get the notification ID
      const notificationsRes = await fetch('http://localhost:8000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const notificationsData = await notificationsRes.json();
      if (notificationsData.success) {
        const notification = notificationsData.notifications.find(n => n.restaurant_id === restaurant.id);
        
        if (notification) {
          const deleteRes = await fetch(`http://localhost:8000/api/notifications/${notification.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const deleteData = await deleteRes.json();
          if (deleteData.success) {
            setUserHasNotification(null);
            alert('Notification removed');
          }
        }
      }
    } catch (error) {
      console.error('Remove notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'green': return 'Low';
      case 'yellow': return 'Moderate';
      case 'orange': return 'Busy';
      case 'red': return 'Very High';
      default: return status;
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'green': return 'Get a table easily';
      case 'yellow': return 'Some wait time';
      case 'orange': return 'Consider going soon';
      case 'red': return 'Long wait expected';
      default: return '';
    }
  };

  const shortAddress = restaurant.address ? 
    restaurant.address.split(',')[0].trim() : 
    'Location not available';

  return (
    <>
      <div className="restaurant-card" onClick={handleClick}>
        <div className="card-header">
          <div className="card-title-section">
            <h3>{restaurant.name}</h3>
            {/* Rating Display - Static for now */}
            <div className="rating-display">
              <span className="rating-stars">★★★★★</span>
              <span className="rating-text">(4.2)</span>
            </div>
          </div>
          
          <div className={`status-badge ${restaurant.status}`}>
            {restaurant.crowdLevel}
          </div>
        </div>

        <div className="card-details">
          <p className="cuisine">{restaurant.cuisine}</p>
          <p className="occupancy">Occupancy: {restaurant.occupancy}%</p>
          <p className="location">📍 {shortAddress}</p>
        </div>

        {/* Action Buttons */}
        <div className="card-actions">
          <button 
            className={`bookmark-btn ${isBookmarked ? 'active' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleBookmarkClick}
            disabled={loading}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark restaurant"}
          >
            {loading ? '...' : (isBookmarked ? '★ Bookmarked' : '☆ Bookmark')}
          </button>
          
          <button 
            className={`notification-btn ${userHasNotification ? 'active' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleNotificationClick}
            disabled={loading}
            aria-label={userHasNotification ? "Change notification" : "Set notification"}
          >
            {loading ? '...' : (userHasNotification ? `🔔 ${getStatusText(userHasNotification)}` : '🔔 Notify Me')}
          </button>
        </div>

        {/* Show current notification setting */}
        {userHasNotification && (
          <div className="current-notification">
            <small>You'll be notified at: <span className={`status-${userHasNotification}`}>{getStatusText(userHasNotification)}</span></small>
            <button 
              className="remove-notification-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveNotification();
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="notification-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Notify me when {restaurant.name} is:</h4>
            <p className="modal-subtitle">You'll get a notification when crowd reaches this level</p>
            
            <div className="notification-options">
              {['green', 'yellow', 'orange', 'red'].map((status) => (
                <button 
                  key={status}
                  className={`notification-option ${status} ${userHasNotification === status ? 'selected' : ''}`}
                  onClick={() => handleSetNotification(status)}
                  disabled={loading}
                >
                  <div className="status-indicator-wrapper">
                    <div className={`status-indicator ${status}`}></div>
                    {userHasNotification === status && <div className="selected-check">✓</div>}
                  </div>
                  <div className="option-text">
                    <span className="option-title">{getStatusText(status)} Crowd</span>
                    <small className="option-desc">{getStatusDescription(status)}</small>
                  </div>
                </button>
              ))}
            </div>
            
            {userHasNotification && (
              <button 
                className="remove-all-btn"
                onClick={handleRemoveNotification}
                disabled={loading}
              >
                Remove My Notification
              </button>
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowNotificationModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RestaurantCard;