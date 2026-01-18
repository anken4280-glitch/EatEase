import React, { useState, useEffect } from "react";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import RestaurantOwnerDashboard from "./components/RestaurantOwnerDashboard/RestaurantOwnerDashboard";
import AdminPanel from './components/AdminPanel/AdminPanel';
import "./globals.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState("restaurantList");

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // DEBUG: Monitor token changes
  useEffect(() => {
    let lastToken = localStorage.getItem("auth_token");

    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("auth_token");
      if (lastToken !== currentToken) {
        console.log("🔍 TOKEN CHANGED!");
        console.log("Was:", lastToken ? "Exists" : "Missing");
        console.log("Now:", currentToken ? "Exists" : "Missing");
        console.log("Stack trace:", new Error().stack);
        lastToken = currentToken;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle successful login
  const handleLogin = (userData) => {
    console.log("✅ Login successful:", {
      name: userData.name,
      user_type: userData.user_type,
      is_admin: userData.is_admin
    });
    setUser(userData);
    setCurrentPage("restaurantList");
  };

  // Handle successful signup
  const handleSignup = (userData) => {
    console.log("✅ Signup successful:", {
      name: userData.name,
      user_type: userData.user_type,
      is_admin: userData.is_admin
    });
    setUser(userData);
    setCurrentPage("restaurantList");
  };

  // Navigation functions
  const handleNavigateToBookmarks = () => {
    setCurrentPage("bookmarks");
  };

  const handleNavigateToNotifications = () => {
    setCurrentPage("notifications");
  };

  const handleNavigateBack = () => {
    setCurrentPage("restaurantList");
  };

  // Show loading while checking authentication
  if (loading) {
    return <div className="app"><p>Loading...</p></div>;
  }

  // NOT LOGGED IN - Show Login/Signup
  if (!user) {
    return (
      <div className="app">
        {isLogin ? (
          <Login onLogin={handleLogin} onSwitchToSignup={() => setIsLogin(false)} />
        ) : (
          <Signup onSignup={handleSignup} onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    );
  }

  // LOGGED IN - Show debug info
  console.log("🎯 APP ROUTING WITH USER:", {
    id: user.id,
    name: user.name,
    user_type: user.user_type,
    is_admin: user.is_admin,
    currentPage: currentPage
  });

  // 1. ADMIN USERS - Go to AdminPanel
  if (user.is_admin === true || user.is_admin === 1) {
    console.log("🛡️ Routing: ADMIN → AdminPanel");
    return (
      <div className="app">
        <AdminPanel user={user} />
      </div>
    );
  }

  // 2. RESTAURANT OWNERS - Go to RestaurantOwnerDashboard
  if (user.user_type === "restaurant_owner") {
    console.log("🏪 Routing: RESTAURANT OWNER → RestaurantOwnerDashboard");
    return (
      <div className="app">
        <RestaurantOwnerDashboard user={user} />
      </div>
    );
  }

  // 3. DINERS - Show navigation with pages
  if (user.user_type === "diner") {
    console.log("🍽️ Routing: DINER → " + currentPage);
    
    switch (currentPage) {
      case "bookmarks":
        return (
          <div className="app">
            <BookmarksPage user={user} onBack={handleNavigateBack} />
          </div>
        );

      case "notifications":
        return (
          <div className="app">
            <NotificationsPage user={user} onBack={handleNavigateBack} />
          </div>
        );

      default: // 'restaurantList'
        return (
          <div className="app">
            <RestaurantList
              user={user}
              onNavigateToBookmarks={handleNavigateToBookmarks}
              onNavigateToNotifications={handleNavigateToNotifications}
            />
          </div>
        );
    }
  }

  // 4. FALLBACK - If user_type is unknown, show RestaurantList
  console.log("⚠️ Unknown user_type, defaulting to RestaurantList:", user.user_type);
  return (
    <div className="app">
      <RestaurantList
        user={user}
        onNavigateToBookmarks={handleNavigateToBookmarks}
        onNavigateToNotifications={handleNavigateToNotifications}
      />
    </div>
  );
}

export default App;