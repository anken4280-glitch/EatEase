import React from "react";
import "./Filters.css";

function Filters({ filters, setFilters, showFilters, setShowFilters }) {
  return (
    <div className="filters">
      <button
        className="filter-button"
        onClick={() => setShowFilters(!showFilters)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="white"
          viewBox="0 0 256 256"
        >
          <path d="M176,80a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H184A8,8,0,0,1,176,80ZM40,88H144v16a8,8,0,0,0,16,0V56a8,8,0,0,0-16,0V72H40a8,8,0,0,0,0,16Zm176,80H120a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16ZM88,144a8,8,0,0,0-8,8v16H40a8,8,0,0,0,0,16H80v16a8,8,0,0,0,16,0V152A8,8,0,0,0,88,144Z"></path>
        </svg>{" "}
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
          <div>
            <label>Type</label>
            <select name="" id="">
              <option value="">All</option>
              <option value="">Basic</option>
              <option value="">Premium</option>
            </select>
          </div>
          <button class="set-preference-button">Set Preference</button>
          <button className="search-button">Search</button>
        </div>
      )}
    </div>
  );
}

export default Filters;
