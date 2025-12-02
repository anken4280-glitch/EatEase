import React, { useState, useEffect } from "react";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import RestaurantList from "./components/RestaurantList/RestaurantList";
import RestaurantOwnerDashboard from "./components/RestaurantOwnerDashboard/RestaurantOwnerDashboard";
import BookmarksPage from "./components/BookmarksPage/BookmarksPage";
import NotificationsPage from "./components/NotificationsPage/NotificationsPage";
import "./globals.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true); // ADD THIS STATE
  const [currentPage, setCurrentPage] = useState("restaurantList"); // ADD THIS LINE

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

  // SEE TOKENNNN
  useEffect(() => {
    let lastToken = localStorage.getItem("auth_token");

    // Check token every second
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
    setUser(userData);
    setCurrentPage("restaurantList"); // ADD THIS
  };

  // Handle successful signup
  const handleSignup = (userData) => {
    setUser(userData);
    setCurrentPage("restaurantList"); // ADD THIS
  };

  // Add these navigation functions after the handlers above
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
    return (
      <div className="app">
        <p>Loading...</p>
      </div>
    );
  }

  // Role-based routing with page navigation
  if (!user) {
    return (
      <div className="app">
        {isLogin ? (
          <Login
            onLogin={handleLogin}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <Signup
            onSignup={handleSignup}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    );
  }

  // Diner navigation flow
  if (user.user_type === "diner") {
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

  // Role-based routing with auth switching:
  // - No user → Show Login OR Signup based on isLogin state
  // - User is diner → Show RestaurantList
  // - User is restaurant_owner → Show RestaurantOwnerDashboard
  return (
    <div className="app">
      {!user ? (
        isLogin ? (
          <Login
            onLogin={handleLogin}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <Signup
            onSignup={handleSignup}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )
      ) : user.user_type === "diner" ? (
        <RestaurantList user={user} />
      ) : (
        <RestaurantOwnerDashboard user={user} />
      )}
    </div>
  );
}

export default App;
