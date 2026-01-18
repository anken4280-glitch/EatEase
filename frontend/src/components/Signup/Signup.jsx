import "./Signup.css";
import React, { useState } from "react";

function Signup({ onSignup, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🎯 Business App signup: Force restaurant_owner
      const signupData = {
        ...formData,
        user_type: "restaurant_owner", // ← ALWAYS restaurant owner
        is_admin: false                // ← Admins created manually
      };

      const response = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-App": "restaurant-app", // ← CRITICAL!
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      // ✅ Check for validation errors
      if (response.status === 422 && data.errors) {
        const firstError = Object.values(data.errors)[0]?.[0];
        setError(firstError || "Validation failed");
        return;
      }

      if (response.ok && data.user && data.token) {
        // ✅ Verify this is a business account
        if (data.user.user_type !== 'restaurant_owner') {
          alert('Error: Account was not created as restaurant owner.');
          return;
        }

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onSignup(data.user);
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup">
      <div className="signup-container">
        <h2>Sign Up</h2>
        <p className="business-description">
          Register restaurant on EatEase
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          {/* Always Restaurant-app account*/}
          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="business-signup-button">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin} className="switch-button">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;