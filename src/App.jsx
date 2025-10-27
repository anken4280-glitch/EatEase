import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import RestaurantList from "./components/RestaurantList";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

export default function App(){
  return (
    <div className="app">
      <header className="topbar">
        <h1>EatEase</h1>
        <nav>
          <Link to="/">Diner</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<RestaurantList />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>

      <footer className="footer">
        <small>EatEase • Progressive Web App</small>
      </footer>
    </div>
  );
}
