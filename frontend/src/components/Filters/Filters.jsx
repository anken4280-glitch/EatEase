import React, { useState } from "react";
import './Filters.css';

export default function Filters({ filters, setFilters, restaurants }) {
  const [searchTerm, setSearchTerm] = useState("");
  const cuisines = Array.from(new Set(restaurants.map(r => r.cuisine))).filter(Boolean);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setFilters(f => ({ ...f, search: e.target.value }));
  };

  return (
    <div className={`enhanced-filters`}>
      <div className="search-section">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Filters section */}
      <div className="filter-grid">
        <label>
          Cuisine
          <select value={filters.cuisine} onChange={e => setFilters(f => ({ ...f, cuisine: e.target.value }))}>
            <option value="all">All Cuisines</option>
            {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={e => setFilters(f => ({ ...f, openNow: e.target.checked }))}
          />
          Open now
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.hasPromo}
            onChange={e => setFilters(f => ({ ...f, hasPromo: e.target.checked }))}
          />
          Has Promotions
        </label>

        <label>
          Crowd Level
          <select value={filters.crowdLevel} onChange={e => setFilters(f => ({ ...f, crowdLevel: e.target.value }))}>
            <option value="all">Any Crowd</option>
            <option value="low">Low (Green)</option>
            <option value="moderate">Moderate (Yellow)</option>
            <option value="high">High (Red)</option>
          </select>
        </label>
      </div>
    </div>
  );
}
