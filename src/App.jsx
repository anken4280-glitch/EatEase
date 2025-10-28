import React, { useState } from "react";
import RestaurantList from "./components/RestaurantList";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [view, setView] = useState("diner");

  return (
    <div style={{ padding: "20px" }}>
      <h1>🍽️ EatEase – Crowd Monitor</h1>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setView("diner")}>👥 Diner View</button>
        <button onClick={() => setView("admin")}>🧑‍💼 Admin View</button>
      </div>

      {view === "diner" ? <RestaurantList /> : <AdminDashboard />}
    </div>
  );
}
