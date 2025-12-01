import React from 'react';
import './Filters.css';

function Filters({ filters, setFilters, showFilters, setShowFilters }) {
  return (
    <div className="filters">
      <button 
        className="filter-button"
        onClick={() => setShowFilters(!showFilters)}
      >
        Filter
      </button>
      
      {showFilters && (
        <div className="filter-options">
          {/* Add filter options here */}
          <div>
            <label>Cuisine</label>
            <select>
              <option>All</option>
              <option>Fast Food</option>
              <option>Cafe</option>
              <option>Filipino</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select>
              <option>All</option>
              <option>Low Crowd</option>
              <option>Moderate</option>
              <option>High Crowd</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default Filters;