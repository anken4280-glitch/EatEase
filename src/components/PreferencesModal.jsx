import React, { useState } from "react";

export default function PreferencesModal({ isOpen, onClose, onSave, currentPreferences }) {
  const [preferences, setPreferences] = useState(currentPreferences || {
    cuisine: [],
    budget: "medium",
    crowdTolerance: "medium",
    maxWaitTime: 20,
    diningOccasion: "casual",
    groupSize: 2
  });

  const cuisines = ["Italian", "Chinese", "Japanese", "Mexican", "American", "Indian", "Thai", "Filipino", "Korean", "Mediterranean"];

  const toggleCuisine = (cuisine) => {
    setPreferences(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine) 
        ? prev.cuisine.filter(c => c !== cuisine)
        : [...prev.cuisine, cuisine]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Set Your Dining Preferences</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="preferences-form">
          <div className="preference-section">
            <label>Favorite Cuisines</label>
            <div className="cuisine-tags">
              {cuisines.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  className={`cuisine-tag ${preferences.cuisine.includes(cuisine) ? 'active' : ''}`}
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          <div className="preference-section">
            <label>Budget Range</label>
            <select 
              value={preferences.budget}
              onChange={(e) => setPreferences({...preferences, budget: e.target.value})}
            >
              <option value="low">💰 Budget (Under ₱200)</option>
              <option value="medium">💰💰 Moderate (₱200-₱500)</option>
              <option value="high">💰💰💰 Premium (₱500+)</option>
            </select>
          </div>

          <div className="preference-section">
            <label>Crowd Tolerance</label>
            <select 
              value={preferences.crowdTolerance}
              onChange={(e) => setPreferences({...preferences, crowdTolerance: e.target.value})}
            >
              <option value="low">🟢 Prefer Quiet (Low Crowd)</option>
              <option value="medium">🟡 Moderate Crowd OK</option>
              <option value="high">🔴 Don't Mind Busy Places</option>
            </select>
          </div>

          <div className="preference-section">
            <label>Maximum Wait Time: {preferences.maxWaitTime} minutes</label>
            <input 
              type="range" 
              min="5" 
              max="60" 
              step="5"
              value={preferences.maxWaitTime}
              onChange={(e) => setPreferences({...preferences, maxWaitTime: parseInt(e.target.value)})}
            />
          </div>

          <div className="preference-section">
            <label>Dining Occasion</label>
            <select 
              value={preferences.diningOccasion}
              onChange={(e) => setPreferences({...preferences, diningOccasion: e.target.value})}
            >
              <option value="casual">🍔 Casual Dining</option>
              <option value="business">💼 Business Meal</option>
              <option value="date">💑 Romantic Date</option>
              <option value="family">👨‍👩‍👧‍👦 Family Gathering</option>
            </select>
          </div>

          <div className="preference-section">
            <label>Group Size: {preferences.groupSize} people</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={preferences.groupSize}
              onChange={(e) => setPreferences({...preferences, groupSize: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(preferences)} className="btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>
  );
}