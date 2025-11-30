import React from 'react';
import './Signup.css';

function Signup() {
  return (
    <div className="signup">
      <h3>Signup</h3>
      <p>Building...</p>
    </div>
  );
}

export default Signup;

function Signup({ onSignup }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'diner' // Default to diner
  });

  return (
    <div className="signup">
      <h2>Sign Up</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Existing fields... */}
        
        <div className="form-group">
          <label>Type: </label>
          <select 
            name="user_type" 
            value={formData.user_type}
            onChange={handleChange}
          >
            <option value="diner">🍽️ Diner</option>
            <option value="restaurant_owner">🏪 Restaurant Owner</option>
          </select>
        </div>

        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}