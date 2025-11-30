import React, { useState, useEffect } from 'react';
import Login from './components/Login/Login';
import RestaurantList from './components/RestaurantList/RestaurantList';
import RestaurantOwnerDashboard from './components/RestaurantOwnerDashboard/RestaurantOwnerDashboard'; // ADD THIS IMPORT
import './globals.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Handle successful login
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="app">
        <p>Loading...</p>
      </div>
    );
  }

  // Role-based routing:
  // - No user → Show Login
  // - User is diner → Show RestaurantList  
  // - User is restaurant_owner → Show RestaurantOwnerDashboard
  return (
    <div className="app">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.user_type === 'diner' ? (
        <RestaurantList user={user} />
      ) : (
        <RestaurantOwnerDashboard user={user} /> // This will show for restaurant owners
      )}
    </div>
  );
}

export default App;