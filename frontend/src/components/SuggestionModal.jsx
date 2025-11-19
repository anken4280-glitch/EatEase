import React from "react";

export default function SuggestionModal({ isOpen, onClose, suggestions, userPreferences }) {
  if (!isOpen || !suggestions.length) return null;

  const topSuggestion = suggestions[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content suggestion-modal">
        <div className="modal-header">
          <h3>🎯 Perfect Place Found for You!</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="suggestion-content">
          <div className="top-suggestion">
            <div className="suggestion-card featured">
              <div className="match-badge">
                {topSuggestion.matchScore}% Match
              </div>
              <div className="card-header">
                <h4>{topSuggestion.restaurant.name}</h4>
                <span className="cuisine-badge">{topSuggestion.restaurant.cuisine}</span>
              </div>
              
              <div className="suggestion-details">
                <div className="detail-row">
                  <span className="label">Crowd Level:</span>
                  <span className={`value status-${topSuggestion.restaurant.status}`}>
                    {topSuggestion.restaurant.crowdLevel} ({topSuggestion.restaurant.occupancy}%)
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Wait Time:</span>
                  <span className="value">{topSuggestion.restaurant.waitTime} minutes</span>
                </div>
                <div className="detail-row">
                  <span className="label">Rating:</span>
                  <span className="value">⭐ {topSuggestion.restaurant.rating}/5</span>
                </div>
              </div>

              <div className="reasons-section">
                <h5>Why this matches your preferences:</h5>
                <ul>
                  {topSuggestion.reasons.map((reason, index) => (
                    <li key={index}>✓ {reason}</li>
                  ))}
                </ul>
              </div>

              {topSuggestion.restaurant.hasPromo && (
                <div className="promo-banner">
                  🎁 Special promotions available!
                </div>
              )}
            </div>
          </div>

          {suggestions.length > 1 && (
            <div className="alternative-suggestions">
              <h4>Other Great Options:</h4>
              <div className="alternative-cards">
                {suggestions.slice(1, 4).map((suggestion, index) => (
                  <div key={suggestion.restaurant.id} className="suggestion-card alternative">
                    <div className="match-badge small">
                      {suggestion.matchScore}% Match
                    </div>
                    <h5>{suggestion.restaurant.name}</h5>
                    <div className="quick-details">
                      <span>{suggestion.restaurant.cuisine}</span>
                      <span>🟢 {suggestion.restaurant.crowdLevel}</span>
                      <span>⏱️ {suggestion.restaurant.waitTime}min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-primary">
            🍽️ Let's Go to {topSuggestion.restaurant.name}!
          </button>
          <button onClick={onClose} className="btn-secondary">
            Show More Options
          </button>
        </div>
      </div>
    </div>
  );
}