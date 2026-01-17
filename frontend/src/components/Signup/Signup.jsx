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
      // 🎯 ALWAYS send user_type as "diner" - no choice!
      const signupData = {
        ...formData,
        user_type: "diner", // Force diner type
      };

      const response = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-App": "diner-app",
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      // ✅ FIX: Your backend returns {user, token} NOT {success: true}
      if (response.ok && data.user && data.token) {
        // ✅ Verify backend created a diner account
        if (data.user.user_type !== "diner") {
          alert("Error: Account was not created as diner. Please contact support.");
          return;
        }

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onSignup(data.user);
      } else {
        // Handle validation errors
        if (response.status === 422 && data.errors) {
          const firstError = Object.values(data.errors)[0]?.[0];
          setError(firstError || "Validation failed");
        } else {
          setError(data.message || "Signup failed");
        }
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
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
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
              placeholder="Email"
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
              placeholder="Password"
              required
              minLength="8"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="signup-button">
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