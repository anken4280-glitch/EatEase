import React, { useState } from "react";
import "./Login.css";

function Login({ onLogin, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
    console.log("🔍 LOGIN ATTEMPT:", formData);
    
    const response = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-App": "diner-app"
      },
      body: JSON.stringify(formData),
    });

    console.log("🔍 RESPONSE STATUS:", response.status);
    const data = await response.json();
    console.log("🔍 FULL RESPONSE:", data);

    // ✅ Check for validation errors
    if (response.status === 422 && data.errors) {
      console.log("🔍 VALIDATION ERRORS:", data.errors);
      // Show first error
      const firstError = Object.values(data.errors)[0]?.[0];
      setError(firstError || "Validation failed");
      return;
    }

    // ✅ FIRST: Check for wrong-app error from backend
    if (data.error === 'wrong_app') {
      alert(data.message);
      window.location.href = data.redirect_url;
      return;
    }

    // ✅ Handle successful login (different format than expected!)
    if (response.ok && data.user && data.token) {
      // Your backend returns {user: {...}, token: '...'} NOT {success: true}
      console.log("✅ LOGIN SUCCESS:", data.user);
      
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Verify diner
      if (data.user.user_type !== "diner") {
        alert("This is the Diner App. Please use the Business App.");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        window.location.href = "http://localhost:5177";
        return;
      }

      onLogin(data.user);
    } else {
      setError(data.message || "Login failed");
    }
  } catch (err) {
    console.error("🔍 LOGIN ERROR:", err);
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login">
      <div className="login-container">
        <h2>Sign In</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
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

          <div className="login-form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Display error messages */}
          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
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