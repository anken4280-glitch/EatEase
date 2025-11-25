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

  const cuisines = ["Pakistani", "Roasted Chicken"];

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
    <div className="preferences-inline">
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

        <div className="preferences-grid">
          <div className="preference-section">
            <label>Price Range</label>
            <select 
              value={preferences.price}
              onChange={(e) => setPreferences({...preferences, budget: e.target.value})}
            >
              <option value="low">💰 Budget (Under ₱200)</option>
              <option value="medium">💰💰 Moderate (₱200-₱500)</option>
              <option value="high">💰💰💰 Premium (₱500+)</option>
            </select>
          </div>

          <div className="preference-section">
            <label>Crowd Status</label>
            <select 
              value={preferences.tolerance}
              onChange={(e) => setPreferences({...preferences, budget: e.target.value})}
            >
              <option value="low">🟢 Prefer Quiet (Low Crowd)</option>
              <option value="medium">🟡 Moderate Crowd OK</option>
              <option value="high">🔴 Don't Mind Busy Places</option>
            </select>
          </div>

        </div>

        <div className="preferences-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(preferences)} className="btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>
  );
}