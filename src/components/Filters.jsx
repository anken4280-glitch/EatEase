import React from "react";

export default function Filters({ filters, setFilters, restaurants }){
  const cuisines = Array.from(new Set(restaurants.map(r => r.cuisine))).filter(Boolean);
  return (
    <div className="filters">
      <label>
        Cuisine
        <select value={filters.cuisine} onChange={e => setFilters(f => ({...f, cuisine: e.target.value}))}>
          <option value="all">All</option>
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
    </div>
  );
}
