import React, { useState } from 'react';
import './VerificationRequest.css';

function VerificationRequest({ restaurant, onRequestSubmitted, onClose }) {
  const [requestText, setRequestText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (requestText.length < 50) {
      setError('Please provide at least 50 characters explaining why your restaurant should be verified');
      return;
    }
    
    if (requestText.length > 1000) {
      setError('Request must be less than 1000 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch('http://localhost:8000/api/restaurant/request-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          verification_request: requestText
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        if (onRequestSubmitted) onRequestSubmitted();
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Verification request error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="verification-request success-modal">
        <div className="success-icon">✅</div>
        <h3>Verification Request Submitted!</h3>
        <p>Your request has been sent to our admin team for review.</p>
        <p>You'll be notified once your restaurant is verified.</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <div className="verification-request">
      <div className="verification-header">
        <h2>Request Verification Badge</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="verification-benefits">
        <h3>✨ Benefits of Being Verified:</h3>
        <ul>
          <li>✅ <strong>Trust Badge</strong> - Builds customer confidence</li>
          <li>✅ <strong>Priority Listing</strong> - Higher in search results</li>
          <li>✅ <strong>Official Status</strong> - Verified by EatEase team</li>
          <li>✅ <strong>Increased Visibility</strong> - More customer trust</li>
        </ul>
        <p className="note"><strong>Note:</strong> This is a free service for all restaurants.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="verificationRequest">
            <strong>Why should your restaurant be verified?</strong>
            <span className="char-count">({requestText.length}/1000 characters)</span>
          </label>
          <p className="instruction">
            Please explain why customers should trust your restaurant. Include details about:
            <br />• Your restaurant's history and reputation
            <br />• Food safety standards
            <br />• Customer service commitment
            <br />• Any certifications or awards
          </p>
          
          <textarea
            id="verificationRequest"
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="Example: Our restaurant has been serving authentic Italian cuisine since 2010. We maintain the highest food safety standards with regular health inspections scoring 95%+. Our commitment to customer satisfaction is reflected in our 4.8-star average rating from over 500 reviews..."
            rows="8"
            minLength="50"
            maxLength="1000"
            required
          />
          
          <div className="validation-info">
            <span className={`length-check ${requestText.length >= 50 ? 'valid' : 'invalid'}`}>
              {requestText.length >= 50 ? '✅' : '⏳'} Minimum 50 characters
            </span>
            <span className={`length-check ${requestText.length <= 1000 ? 'valid' : 'invalid'}`}>
              {requestText.length <= 1000 ? '✅' : '⚠️'} Maximum 1000 characters
            </span>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || requestText.length < 50 || requestText.length > 1000}
            className="submit-btn"
          >
            {loading ? 'Submitting...' : 'Submit Verification Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VerificationRequest;