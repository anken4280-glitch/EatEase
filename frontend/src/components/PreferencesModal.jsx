import React, { useState } from "react";

export default function PreferencesModal({ isOpen, onClose, onSave, currentPreferences }) {
  const [preferences, setPreferences] = useState(currentPreferences || {
    cuisine: [],
    budget: "medium",
    crowdTolerance: "medium",
    openNow: false,
    hasPromo: false
  });

  const cuisines = ["Pakistan Cuisine, Lechon Manok"];

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
        {/* Favorite Cuisines */}
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

        {/* Budget & Crowd Tolerance */}
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
              value={preferences.crowdStatus}
              onChange={(e) => setPreferences({...preferences, crowdTolerance: e.target.value})}
            >
              <option value="low">🟢 Prefer Quiet</option>
              <option value="medium">🟡 Moderate Crowd OK</option>
              <option value="high">🔴 Busy Places Are Fine</option>
            </select>
          </div>

          <div className="preference-section">
            <label>
              <input 
                type="checkbox"
                checked={preferences.openNow}
                onChange={(e) => setPreferences({...preferences, openNow: e.target.checked})}
              />
              Open Now Only
            </label>
          </div>

          <div className="preference-section">
            <label>
              <input 
                type="checkbox"
                checked={preferences.hasPromo}
                onChange={(e) => setPreferences({...preferences, hasPromo: e.target.checked})}
              />
              Show Promotions
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="preferences-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(preferences)} className="btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>
  );
}
