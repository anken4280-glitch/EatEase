import React, { useState, useEffect } from "react";
import RestaurantList from "./components/RestaurantList";
import AdminDashboard from "./components/AdminDashboard";
import Filters from "./components/Filters";
import Login from "./components/Login";
import Signup from "./components/Signup";
import PreferencesModal from "./components/PreferencesModal";
import SuggestionModal from "./components/SuggestionModal";
import { RecommendationEngine } from "./utils/RecommendationEngine";
import { getCurrentUser, logoutUser, fetchRestaurants } from "./api";

// ⭐ ADD THESE TWO IMPORTS
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback";

export default function App() {
  const [view, setView] = useState("diner");
  const [filters, setFilters] = useState({
    cuisine: "all",
    openNow: false,
    hasPromo: false,
    crowdLevel: "all",
    search: "",
    location: ""
  });
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  useEffect(() => {
    console.log("App mounted, checking auth status...");
    checkAuthStatus();

    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  useEffect(() => {
    console.log("User state changed:", user);
  }, [user]);

  const checkAuthStatus = async () => {
    console.log("Checking auth status...");
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const result = await getCurrentUser(token);
        if (result && result.user) {
          setUser(result.user);
        } else {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setAuthView("login");
    setTimeout(() => checkAuthStatus(), 100);
  };

  const handleSignup = (userData) => {
    setUser(userData);
    setAuthView("login");
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) await logoutUser(token);

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setView("diner");
  };

  const handleSavePreferences = (preferences) => {
    setUserPreferences(preferences);
    setShowPreferencesModal(false);
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  };

  const handleSuggestPlace = async () => {
    if (!userPreferences) {
      setShowPreferencesModal(true);
      alert("Please set your dining preferences first!");
      return;
    }

    try {
      const restaurants = await fetchRestaurants();
      const suggestions = restaurants
        .map((restaurant) => {
          const matchScore = RecommendationEngine.calculateMatchScore(
            restaurant,
            userPreferences,
            new Date()
          );
          const reasons = RecommendationEngine.getRecommendationReason(
            restaurant,
            userPreferences,
            matchScore
          );
          return { restaurant, matchScore, reasons };
        })
        .filter((s) => s.matchScore >= 40)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      if (suggestions.length > 0) {
        setSuggestions(suggestions);
        setShowSuggestionModal(true);
      } else {
        alert("No great matches found right now.");
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Unable to generate suggestions. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="app">
          <header className="topbar">
            <div className="container">
              <div className="header-main">
                <div className="header-brand">
                  <h1>🍽️ EatEase</h1>
                  <p className="tagline">Dine with ease</p>
                </div>
              </div>
            </div>
          </header>

          <main className="container main-content">
            {authView === "login" ? (
              <Login
                onLogin={handleLogin}
                onSwitchToSignup={() => setAuthView("signup")}
              />
            ) : (
              <Signup
                onSignup={handleSignup}
                onSwitchToLogin={() => setAuthView("login")}
              />
            )}
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="app">
        <header className="topbar">
          <div className="container">
            <div className="header-main">
              <div className="header-brand">
                <h1>🍽️ EatEase</h1>
                <p className="tagline">Dine with ease</p>
              </div>
              <div className="header-user">
                <span className="user-greeting">Hello, {user.name}</span>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Logout
                </button>
              </div>
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
            </nav>
          </div>
        </header>

        <main className="container main-content">
          {view === "diner" ? (
            <div className="diner-view">
              <div className="view-header">
                <h2>Find Your Perfect Dining Experience</h2>
                <p>Real-time crowd monitoring with IoT technology</p>

                <button
                  onClick={() => setShowPreferencesModal(!showPreferencesModal)}
                  className="preferences-btn"
                >
                  ⚙️ {showPreferencesModal ? "Hide" : "Set"} Dining Preferences
                </button>
              </div>

              {showPreferencesModal && (
                <PreferencesModal
                  isOpen={showPreferencesModal}
                  onClose={() => setShowPreferencesModal(false)}
                  onSave={handleSavePreferences}
                  currentPreferences={userPreferences}
                />
              )}

              <Filters
                filters={filters}
                setFilters={setFilters}
                restaurants={[]}
                onSuggestPlace={handleSuggestPlace}
                userPreferences={userPreferences}
              />

              <RestaurantList filters={filters} currentUser={user} />

              <SuggestionModal
                isOpen={showSuggestionModal}
                onClose={() => setShowSuggestionModal(false)}
                suggestions={suggestions}
                userPreferences={userPreferences}
              />
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
    </ErrorBoundary>
  );
}
