import React, { useState, useEffect } from "react";
import RestaurantList from "./components/RestaurantList";
import AdminDashboard from "./components/AdminDashboard";
import RestaurantOwnerDashboard from "./components/RestaurantOwnerDashboard";
import Filters from "./components/Filters";
import Login from "./components/Login";
import Signup from "./components/Signup";
import PreferencesModal from "./components/PreferencesModal";
import Drawer from "./components/Drawer";
import FeaturedCarousel from "./components/FeaturedCarousel";
import { getCurrentUser, logoutUser } from "./api";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback";

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
  const [userPreferences, setUserPreferences] = useState(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) setUserPreferences(JSON.parse(savedPreferences));
  }, []);

  useEffect(() => {
    if (user) {
      if (user.type === "restaurant_owner") setView("owner");
      else if (user.type === "admin") setView("admin");
      else setView("diner");
    }
  }, [user]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const result = await getCurrentUser(token);
        if (result && result.user) setUser(result.user);
        else {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
        }
      } catch {
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
    setDrawerOpen(false);
  };

  const handleSavePreferences = (preferences) => {
    setUserPreferences(preferences);
    setShowPreferencesModal(false);
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  };

  const getAvailableViews = () => {
    if (!user) return [];
    const views = [];
    if (user.type === "diner") views.push({ id: "diner", label: "👥 Diner View" });
    if (user.type === "restaurant_owner") views.push({ id: "owner", label: "🏪 Owner Dashboard" });
    if (user.type === "admin") {
      views.push(
        { id: "diner", label: "👥 Diner View" },
        { id: "owner", label: "🏪 Owner Dashboard" },
        { id: "admin", label: "🧑‍💼 Admin Dashboard" }
      );
    }
    return views;
  };

  const renderMainContent = () => {
    switch (view) {
      case "diner":
        return (
          <div className="diner-view">
            <div className={`enhanced-filters ${drawerOpen ? "open" : ""}`}>
              <Filters
                filters={filters}
                setFilters={setFilters}
                restaurants={[]}
                userPreferences={userPreferences}
                onFocus={() => setDrawerOpen(true)}
              />
            </div>
            <div className={`restaurant-list-wrapper ${drawerOpen ? "shifted" : ""}`}>
              <RestaurantList filters={filters} currentUser={user} />
            </div>
          </div>
        );
      case "owner":
        return <RestaurantOwnerDashboard />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <RestaurantList filters={filters} currentUser={user} />;
    }
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );

  if (!user)
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
              <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthView("signup")} />
            ) : (
              <Signup onSignup={handleSignup} onSwitchToLogin={() => setAuthView("login")} />
            )}
          </main>
        </div>
      </ErrorBoundary>
    );

  const availableViews = getAvailableViews();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="app">
        <header className="topbar">
          <div className="container">
            <div className="header-main" style={{ position: "relative" }}>
              <div className="header-brand">
                <h1>🍽️ EatEase</h1>
                <p className="tagline">Dine with ease</p>
              </div>

              <div className="header-user" style={{ position: "relative" }}>
                <span className="user-greeting">Hello, {user.name}</span>

                <button
                  className={`dropdown-toggle ${drawerOpen ? "active" : ""}`}
                  onClick={() => setDrawerOpen(!drawerOpen)}
                >
                  ☰
                </button>

                <Drawer
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  onLogout={handleLogout}
                  user={user}
                  userPreferences={userPreferences}
                  setShowPreferencesModal={setShowPreferencesModal}
                  bookmarks={[]} // Removed mock restaurants
                />
              </div>
            </div>

            {availableViews.length > 1 && (
              <nav className="nav-links">
                {availableViews.map((viewItem) => (
                  <button
                    key={viewItem.id}
                    className={`nav-btn ${view === viewItem.id ? "active" : ""}`}
                    onClick={() => setView(viewItem.id)}
                  >
                    {viewItem.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </header>

        {/* Featured Carousel without mock restaurants */}
        <FeaturedCarousel featuredRestaurants={[]} />

        {/* Preferences Modal below carousel */}
        {showPreferencesModal && (
          <PreferencesModal
            isOpen={showPreferencesModal}
            onClose={() => setShowPreferencesModal(false)}
            onSave={handleSavePreferences}
            currentPreferences={userPreferences}
            style={{
              position: "relative",
              margin: "20px auto 0",
              left: 0,
              transform: "none",
              zIndex: 2000
            }}
          />
        )}

        <main className="container main-content">{renderMainContent()}</main>

        <footer className="footer">
          <div className="container">
            <p>CIT6 - Capstone Project 1 | Promoting Beneficial and Sustainable Tourism</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
