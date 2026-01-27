import React, { useState, useEffect } from "react";
import "./Login.css";

function Login({ onLogin, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Check for stored login attempts
  useEffect(() => {
    const attempts = localStorage.getItem('business_login_attempts');
    if (attempts) {
      setLoginAttempts(parseInt(attempts));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Frontend rate limiting
    if (loginAttempts >= 5) {
      const lastAttempt = localStorage.getItem('last_business_login_attempt');
      if (lastAttempt) {
        const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
        if (timeSinceLastAttempt < 300000) { // 5 minutes
          setError("Too many login attempts. Please try again in 5 minutes.");
          return;
        }
      }
    }

    setLoading(true);
    setError("");

    try {
      // FIXED URL: Use the correct WAMP URL
      const response = await fetch("http://localhost/EatEase-Backend/backend/public/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-App": "restaurant-app"
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Handle different error cases
      if (response.status === 422 && data.errors) {
        const firstError = Object.values(data.errors)[0]?.[0];
        setError(firstError || "Validation failed");
        incrementLoginAttempts();
        return;
      }

      if (response.status === 429) {
        setError(data.message || "Too many attempts. Please wait.");
        return;
      }

      // Check for wrong-app error
      if (data.error === 'wrong_app') {
        alert(data.message);
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        }
        return;
      }

      // Handle successful login
      if (response.ok && data.user && data.token) {
        // Store auth data
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Store token expiry if provided
        if (data.token_expires_at) {
          localStorage.setItem("token_expires_at", data.token_expires_at);
        }

        // Verify this is a restaurant owner account
        if (data.user.user_type !== "restaurant_owner") {
          alert("This is the Business App. Please use the Diner App.");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          localStorage.removeItem("token_expires_at");
          window.location.href = "http://localhost:5176";
          return;
        }

        // Reset login attempts on success
        localStorage.removeItem('business_login_attempts');
        localStorage.removeItem('last_business_login_attempt');
        
        onLogin(data.user);
      } else {
        setError(data.message || "Invalid email or password");
        incrementLoginAttempts();
      }
    } catch (err) {
      console.error("Business login error:", err);
      setError("Network error. Please check your connection.");
      incrementLoginAttempts();
    } finally {
      setLoading(false);
    }
  };

  const incrementLoginAttempts = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('business_login_attempts', newAttempts.toString());
    localStorage.setItem('last_business_login_attempt', Date.now().toString());
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login">
      <div className="login-container business-login">
        <div className="login-header">
          <h2>Sign In</h2>
        </div>
        
        {loginAttempts >= 3 && (
          <div className="security-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#ff922b"
              viewBox="0 0 256 256"
            >
              <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"></path>
            </svg>
            <span>Multiple failed login attempts detected.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="secure-form">
          <div className="form-group">
            <label htmlFor="business-email">Business Email</label>
            <input
              type="email"
              id="business-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your business email"
              required
              autoComplete="email"
              className={error && !formData.email ? "input-error" : ""}
            />
          </div>

          <div className="form-group">
            <label htmlFor="business-password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="business-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className={error && !formData.password ? "input-error" : ""}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="#666666"
                    viewBox="0 0 256 256"
                  >
                    <path d="M228,175a8,8,0,0,1-10.92-3l-19-33.2A123.23,123.23,0,0,1,162,155.46l5.87,35.22a8,8,0,0,1-6.58,9.21A8.4,8.4,0,0,1,160,200a8,8,0,0,1-7.88-6.69l-5.77-34.58a133.06,133.06,0,0,1-36.68,0l-5.77,34.58A8,8,0,0,1,96,200a8.4,8.4,0,0,1-1.32-.11,8,8,0,0,1-6.58-9.21L94,155.46a123.23,123.23,0,0,1-36.06-16.69L39,172A8,8,0,1,1,25.06,164l20-35a153.47,153.47,0,0,1-19.3-20A8,8,0,1,1,38.22,99c16.6,20.54,45.64,45,89.78,45s73.18-24.49,89.78-45A8,8,0,1,1,230.22,109a153.47,153.47,0,0,1-19.3,20l20,35A8,8,0,0,1,228,175Z"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="#666666"
                    viewBox="0 0 256 256"
                  >
                    <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message security-error">
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={loading ? "loading-button" : "secure-button"}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Don't have an account?{" "}
            <button type="button" onClick={onSwitchToSignup}>
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;