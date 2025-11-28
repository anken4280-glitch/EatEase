import React, { useState } from "react";
import './Filters.css';

export default function Filters({ filters, setFilters, restaurants, onSuggestPlace, userPreferences }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const cuisines = Array.from(new Set(restaurants.map(r => r.cuisine))).filter(Boolean);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setFilters(f => ({...f, search: e.target.value}));
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    setFilters(f => ({...f, location: e.target.value}));
  };

  return (
    <div className="enhanced-filters">
      <div className="search-section">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <input
          type="text"
          placeholder="📍 Enter location..."
          value={location}
          onChange={handleLocationChange}
          className="search-input"
        />
        
        {/* Updated Suggest Button */}
        <button 
          className="suggest-btn"
          onClick={onSuggestPlace}
          type="button"
        >
          🎯 Suggest a Place for Me
        </button>
      </div>

      <div className="filter-grid">
        <label>
          Cuisine
          <select value={filters.cuisine} onChange={e => setFilters(f => ({...f, cuisine: e.target.value}))}>
            <option value="all">All Cuisines</option>
            {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={e => setFilters(f => ({...f, openNow: e.target.checked}))}
          />
          Open now
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.hasPromo}
            onChange={e => setFilters(f => ({...f, hasPromo: e.target.checked}))}
          />
          Has Promotions
        </label>

        <label>
          Crowd Level
          <select value={filters.crowdLevel} onChange={e => setFilters(f => ({...f, crowdLevel: e.target.value}))}>
            <option value="all">Any Crowd</option>
            <option value="low">Low (Green)</option>
            <option value="moderate">Moderate (Yellow)</option>
            <option value="high">High (Red)</option>
          </select>
        </label>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.location || filters.cuisine !== "all" || filters.crowdLevel !== "all") && (
        <div className="active-filters">
          <h4>Active Filters:</h4>
          <div className="filter-tags">
            {filters.search && (
              <span className="filter-tag">
                Search: "{filters.search}" 
                <button onClick={() => setFilters(f => ({...f, search: ""}))}>×</button>
              </span>
            )}
            {filters.location && (
              <span className="filter-tag">
                Location: "{filters.location}"
                <button onClick={() => setFilters(f => ({...f, location: ""}))}>×</button>
              </span>
            )}
            {filters.cuisine !== "all" && (
              <span className="filter-tag">
                Cuisine: {filters.cuisine}
                <button onClick={() => setFilters(f => ({...f, cuisine: "all"}))}>×</button>
              </span>
            )}
            {filters.crowdLevel !== "all" && (
              <span className="filter-tag">
                Crowd: {filters.crowdLevel}
                <button onClick={() => setFilters(f => ({...f, crowdLevel: "all"}))}>×</button>
              </span>
            )}
            {filters.openNow && (
              <span className="filter-tag">
                Open Now
                <button onClick={() => setFilters(f => ({...f, openNow: false}))}>×</button>
              </span>
            )}
            {filters.hasPromo && (
              <span className="filter-tag">
                Has Promotions
                <button onClick={() => setFilters(f => ({...f, hasPromo: false}))}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}