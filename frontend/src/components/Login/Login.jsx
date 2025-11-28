import React, { useState } from "react";
import { loginUser } from "../../api";
import './Login.css';

export default function Login({ onLogin, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      console.log("Attempting login...");
      const result = await loginUser(formData.email, formData.password);
      console.log("Login successful:", result);

      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      console.log("Calling onLogin callback...");
      onLogin(result.user);
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Sign In</h2>
        <p>Please enter your details</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Email"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Don't have an account?{" "}
            <button onClick={onSwitchToSignup} className="switch-button">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
