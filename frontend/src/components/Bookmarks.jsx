import React, { useState, useEffect } from 'react';
import { getBookmarks, toggleBookmark } from '../api';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setLoading(true);
    const data = await getBookmarks();
    setBookmarks(data);
    setLoading(false);
  };

  const handleRemoveBookmark = async (restaurantId) => {
    await toggleBookmark(restaurantId);
    loadBookmarks(); // Reload bookmarks
  };

  if (loading) {
    return (
      <div className="bookmarks-page">
        <div className="loading">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <div className="page-header">
        <h2>📑 My Bookmarks</h2>
        <p>Your saved restaurants</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📑</div>
          <h3>No bookmarks yet</h3>
          <p>Start bookmarking restaurants to see them here!</p>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map(restaurant => (
            <div key={restaurant.id} className="restaurant-card bookmarked">
              <div className="card-header">
                <h3>{restaurant.name}</h3>
                <button 
                  className="bookmark-btn active"
                  onClick={() => handleRemoveBookmark(restaurant.id)}
                  title="Remove bookmark"
                >
                  ❤️
                </button>
              </div>
              
              <p className="cuisine">{restaurant.cuisine} • {restaurant.location}</p>
              
              <div className={`status status-${restaurant.status}`}>
                {restaurant.status.toUpperCase()} ({restaurant.crowdLevel})
              </div>
              
              <div className="restaurant-details">
                <span>👥 {restaurant.occupancy}% full</span>
                <span>⏱️ {restaurant.waitTime} min wait</span>
              </div>

              {restaurant.features && restaurant.features.length > 0 && (
                <div className="features">
                  {restaurant.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="feature-tag">{feature}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}