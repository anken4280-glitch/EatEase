import React, { useState, useEffect } from 'react';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import RestaurantList from './components/RestaurantList/RestaurantList';
import RestaurantOwnerDashboard from './components/RestaurantOwnerDashboard/RestaurantOwnerDashboard'; 
import './globals.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true); // ADD THIS STATE

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

  // Handle successful signup
  const handleSignup = (userData) => {
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
      ) : user.user_type === 'diner' ? (
        <RestaurantList user={user} />
      ) : (
        <RestaurantOwnerDashboard user={user} />
      )}
    </div>
  );
}

export default App; // MOVE THIS TO THE BOTTOM