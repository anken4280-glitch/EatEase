import React, { useState, useEffect } from "react";
import RestaurantList from "./components/RestaurantList";
import AdminDashboard from "./components/AdminDashboard";
import Filters from "./components/Filters";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { getCurrentUser, logoutUser } from "./api";

export default function App() {
  const [view, setView] = useState("diner");
  const [filters, setFilters] = useState({
    cuisine: "all",
    openNow: false,
    hasPromo: false,
    crowdLevel: "all",
    search: ""
  });
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("App mounted, checking auth status...");
    checkAuthStatus();
  }, []);

  useEffect(() => {
    console.log("User state changed:", user);
  }, [user]);

  const checkAuthStatus = async () => {
    console.log("Checking auth status...");
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");
    
    console.log("Token from localStorage:", token);
    console.log("Stored user from localStorage:", storedUser);

    if (token && storedUser) {
      try {
        console.log("Validating token with server...");
        const result = await getCurrentUser(token);
        console.log("Server response:", result);
        
        if (result && result.user) {
          console.log("Setting user from server:", result.user);
          setUser(result.user);
        } else {
          console.log("No user data from server, clearing localStorage");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    } else {
      console.log("No token or user in localStorage");
    }
    setLoading(false);
  };

  const handleLogin = (userData) => {
    console.log("handleLogin called with:", userData);
    // Force a state update
    setUser(userData);
    // Force re-render by changing a state
    setAuthView("login");
    // Force component to re-check authentication
    setTimeout(() => {
      checkAuthStatus();
    }, 100);
  };

  const handleSignup = (userData) => {
    console.log("handleSignup called with:", userData);
    setUser(userData);
    setAuthView("login");
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    const token = localStorage.getItem("auth_token");
    if (token) {
      await logoutUser(token);
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setView("diner");
  };

  if (loading) {
    console.log("Showing loading screen...");
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log("No user, showing auth screen. Current authView:", authView);
    return (
      <div className="app">
        <header className="topbar">
          <div className="container">
            <div className="header-content">
              <h1>🍽️ EatEase</h1>
              <p className="tagline">Dine with ease</p>
            </div>
          </div>
        </header>

        <main className="container main-content">
          {authView === "login" ? (
            <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthView("signup")} />
          ) : (
            <Signup onSignup={handleSignup} onSwitchToLogin={() => setAuthView("login")} />
          )}
        </main>
      </div>
    );
  }

  console.log("User authenticated, showing main app. User:", user);
  return (
    <div className="app">
      <header className="topbar">
        <div className="container">
          <div className="header-content">
            <h1>🍽️ EatEase</h1>
            <p className="tagline">Dine with ease</p>
          </div>
          <nav className="nav-links">
            <button 
              className={`nav-btn ${view === "diner" ? "active" : ""}`}
              onClick={() => setView("diner")}
            >
              👥 Diner View
            </button>
            {user.type === "admin" && (
              <button 
                className={`nav-btn ${view === "admin" ? "active" : ""}`}
                onClick={() => setView("admin")}
              >
                🧑‍💼 Admin View
              </button>
            )}
            <div className="user-menu">
              <span className="user-greeting">Hello, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container main-content">
        {view === "diner" ? (
          <div className="diner-view">
            <div className="view-header">
              <h2>Find Your Perfect Dining Experience</h2>
              <p>Real-time crowd monitoring with IoT technology</p>
            </div>
            <Filters filters={filters} setFilters={setFilters} restaurants={[]} />
            <RestaurantList filters={filters} />
          </div>
        ) : (
          <AdminDashboard />
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>CIT6 - Capstone Project 1 | Promoting Beneficial and Sustainable Tourism</p>
        </div>
      </footer>
    </div>
  );
}