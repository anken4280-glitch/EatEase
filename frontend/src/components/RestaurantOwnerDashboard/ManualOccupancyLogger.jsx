import React, { useState } from 'react';
import './ManualOccupancyLogger.css';

const ManualOccupancyLogger = ({ restaurant, onLogSuccess }) => {
  const [occupancy, setOccupancy] = useState(restaurant.current_occupancy || 0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        'http://localhost/EatEase-Backend/backend/public/api/restaurant/log-occupancy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            occupancy_count: parseInt(occupancy),
            notes: notes
          })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Occupancy logged successfully!');
        setNotes('');
        if (onLogSuccess) onLogSuccess(data);
      } else {
        setError(data.message || 'Failed to log occupancy');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="manual-logger">
      <h3>Update Current Occupancy</h3>
      
      <div className="capacity-display">
        <div className="capacity-meter">
          <div 
            className="capacity-fill" 
            style={{ 
              width: `${(occupancy / restaurant.max_capacity) * 100}%`,
              backgroundColor: occupancy > restaurant.max_capacity * 0.9 ? '#ff6b6b' :
                             occupancy > restaurant.max_capacity * 0.75 ? '#ff922b' :
                             occupancy > restaurant.max_capacity * 0.5 ? '#fcc419' : '#51cf66'
            }}
          ></div>
        </div>
        <div className="capacity-info">
          <span>{occupancy} / {restaurant.max_capacity} ({Math.round((occupancy/restaurant.max_capacity)*100)}%)</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="logger-form">
        <div className="form-group">
          <label>Current Number of Customers:</label>
          <input
            type="range"
            min="0"
            max={restaurant.max_capacity}
            value={occupancy}
            onChange={(e) => setOccupancy(parseInt(e.target.value))}
            className="occupancy-slider"
          />
          <div className="slider-value">
            <input
              type="number"
              min="0"
              max={restaurant.max_capacity}
              value={occupancy}
              onChange={(e) => {
                const val = Math.min(restaurant.max_capacity, Math.max(0, parseInt(e.target.value) || 0));
                setOccupancy(val);
              }}
              className="occupancy-input"
            />
            <span className="max-label">Max: {restaurant.max_capacity}</span>
          </div>
        </div>
        
        <div className="form-group">
          <label>Notes (optional):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., 'Lunch rush', 'Weekend dinner', etc."
            rows="3"
            maxLength="500"
          />
          <small className="char-count">{notes.length}/500 characters</small>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          disabled={loading}
          className="log-btn"
        >
          {loading ? 'Logging...' : 'Log Occupancy'}
        </button>
      </form>
      
      <div className="logger-info">
        <p><strong>Why log occupancy?</strong></p>
        <ul>
          <li>Tracks customer patterns for better staffing</li>
          <li>Provides data for your analytics dashboard</li>
          <li>Helps diners see real-time crowd status</li>
          <li>Improves your restaurant's visibility</li>
        </ul>
      </div>
    </div>
  );
};

export default ManualOccupancyLogger;