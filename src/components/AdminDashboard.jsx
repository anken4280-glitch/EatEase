import React, { useState, useEffect } from "react";
import { fetchRestaurants, updateRestaurantStatus } from "../api";

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    async function loadData() {
      const data = await fetchRestaurants();
      setRestaurants(data);
    }
    loadData();
  }, []);

  const handleUpdate = async (id, status, crowdLevel) => {
    const result = await updateRestaurantStatus(id, status, crowdLevel);
    if (result) {
      alert(`✅ ${result.restaurant.name} updated to ${status.toUpperCase()} (${crowdLevel})`);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? result.restaurant : r))
      );
    }
  };

  return (
    <div>
      <h2>👩‍💼 Admin Dashboard</h2>
      {restaurants.map((r) => (
        <div key={r.id} style={{ margin: "10px 0", padding: "10px", border: "1px solid #ccc" }}>
          <h3>{r.name}</h3>
          <p>
            Current: <strong>{r.status.toUpperCase()}</strong> ({r.crowdLevel})
          </p>
          <button onClick={() => handleUpdate(r.id, "green", "Low")}>🟢 Low</button>
          <button onClick={() => handleUpdate(r.id, "yellow", "Moderate")}>🟡 Moderate</button>
          <button onClick={() => handleUpdate(r.id, "red", "High")}>🔴 High</button>
        </div>
      ))}
    </div>
  );
}
