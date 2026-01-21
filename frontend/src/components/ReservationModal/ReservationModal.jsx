import React, { useState, useEffect } from 'react';
import './ReservationModal.css';

const ReservationModal = ({ restaurant, onClose, onSuccess, notificationData = null }) => {
    const [formData, setFormData] = useState({
        party_size: 1,
        hold_type: 'quick_10min', // Default to 10 minutes
        special_requests: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expiryTime, setExpiryTime] = useState('');
    const [confirmation, setConfirmation] = useState(null);

    // Calculate expiry times when hold_type changes
    useEffect(() => {
        const now = new Date();
        const expiryMinutes = formData.hold_type === 'quick_10min' ? 10 : 20;
        const expiry = new Date(now.getTime() + expiryMinutes * 60000);
        
        setExpiryTime(expiry.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        }));
    }, [formData.hold_type]);

    // Pre-fill from notification if available
    useEffect(() => {
        if (notificationData) {
            setFormData(prev => ({
                ...prev,
                party_size: notificationData.preferred_party_size || 1
            }));
        }
    }, [notificationData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.party_size || formData.party_size < 1 || formData.party_size > 10) {
            setError('Please select a valid party size (1-10 people)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                'http://localhost/EatEase/backend/public/api/reservations/hold-spot',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        restaurant_id: restaurant.id,
                        party_size: formData.party_size,
                        hold_type: formData.hold_type,
                        special_requests: formData.special_requests,
                        notification_id: notificationData?.id || null
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                setConfirmation(data);
                // Success notification
                if (onSuccess) onSuccess(data.hold);
            } else {
                setError(data.message || 'Failed to hold your spot');
            }
        } catch (error) {
            console.error('Error creating spot hold:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError(''); // Clear errors on change
    };

    const handlePartySizeChange = (change) => {
        const newSize = formData.party_size + change;
        if (newSize >= 1 && newSize <= 10) {
            setFormData(prev => ({ ...prev, party_size: newSize }));
            setError('');
        }
    };

    // If we have confirmation, show confirmation screen
    if (confirmation) {
        return (
            <div className="reservation-modal-overlay">
                <div className="reservation-modal">
                    <div className="modal-header">
                        <h2>✅ Spot Reserved!</h2>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>

                    <div className="confirmation-content">
                        <div className="confirmation-icon">
                            <span role="img" aria-label="check mark">✅</span>
                        </div>
                        
                        <div className="confirmation-details">
                            <h3>Your spot is on hold!</h3>
                            
                            <div className="detail-item">
                                <span className="label">Restaurant:</span>
                                <span className="value">{restaurant.name}</span>
                            </div>
                            
                            <div className="detail-item">
                                <span className="label">Hold Duration:</span>
                                <span className="value">
                                    {confirmation.hold.hold_type === 'quick_10min' ? '10 minutes' : '20 minutes'}
                                </span>
                            </div>
                            
                            <div className="detail-item">
                                <span className="label">Expires at:</span>
                                <span className="value highlight">
                                    {new Date(confirmation.hold.expires_at).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: true 
                                    })}
                                </span>
                            </div>
                            
                            <div className="detail-item">
                                <span className="label">Confirmation:</span>
                                <span className="value code">{confirmation.confirmation_code}</span>
                            </div>
                            
                            <div className="detail-item">
                                <span className="label">Party Size:</span>
                                <span className="value">{confirmation.hold.party_size} people</span>
                            </div>
                        </div>

                        <div className="instructions">
                            <h4>🚗 What to do next:</h4>
                            <ul>
                                <li>Go to the restaurant within the hold duration</li>
                                <li>Show your confirmation code at the entrance</li>
                                <li>The restaurant will confirm your hold</li>
                                <li>If they're busy, you may still have a short wait</li>
                            </ul>
                            
                            <div className="note important">
                                <strong>⚠️ Important:</strong> Your spot will be released automatically after {confirmation.hold.hold_type === 'quick_10min' ? '10' : '20'} minutes if you don't arrive.
                            </div>
                        </div>

                        <div className="confirmation-actions">
                            <button 
                                className="done-btn"
                                onClick={onClose}
                            >
                                Got it!
                            </button>
                            <button 
                                className="view-holds-btn"
                                onClick={() => {
                                    // Navigate to "My Holds" page
                                    window.location.href = '/my-holds';
                                }}
                            >
                                View My Holds
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main booking form
    return (
        <div className="reservation-modal-overlay">
            <div className="reservation-modal">
                <div className="modal-header">
                    <h2>Hold My Spot at {restaurant?.name}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {restaurant && (
                    <div className="restaurant-info">
                        <p className="restaurant-name">📍 {restaurant.name}</p>
                        <p className="restaurant-address">{restaurant.address}</p>
                        <div className="restaurant-status">
                            <span className="crowd-level">
                                Current crowd: {restaurant.crowd_level || 'Moderate'}
                            </span>
                            <span className="capacity">
                                👥 Max: {restaurant.max_capacity} people
                            </span>
                        </div>
                    </div>
                )}

                {notificationData && (
                    <div className="notification-context">
                        <div className="notification-badge">
                            ⚡ Responding to Alert
                        </div>
                        <p>
                            {notificationData.preferred_crowd_level === 'low' ? 'Low crowd' : 
                             notificationData.preferred_crowd_level === 'moderate' ? 'Moderate crowd' : 
                             'Ideal crowd'} detected!
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="reservation-form">
                    <div className="form-group">
                        <label>How many people?</label>
                        <div className="party-size-selector">
                            <button 
                                type="button"
                                className="size-btn"
                                onClick={() => handlePartySizeChange(-1)}
                                disabled={formData.party_size <= 1}
                            >
                                −
                            </button>
                            <span className="party-size-display">
                                {formData.party_size} {formData.party_size === 1 ? 'person' : 'people'}
                            </span>
                            <button 
                                type="button"
                                className="size-btn"
                                onClick={() => handlePartySizeChange(1)}
                                disabled={formData.party_size >= 10}
                            >
                                +
                            </button>
                        </div>
                        <small>Maximum 10 people per spot hold</small>
                    </div>

                    <div className="form-group">
                        <label>Choose hold duration:</label>
                        <div className="hold-options">
                            <label className="hold-option">
                                <input
                                    type="radio"
                                    name="hold_type"
                                    value="quick_10min"
                                    checked={formData.hold_type === 'quick_10min'}
                                    onChange={handleChange}
                                />
                                <div className="option-content">
                                    <div className="option-header">
                                        <span className="option-title">Quick Hold (10 min)</span>
                                        <span className="option-badge">Recommended</span>
                                    </div>
                                    <div className="option-details">
                                        <span className="option-icon">⚡</span>
                                        <span className="option-text">I'm ready to go now</span>
                                    </div>
                                    <div className="option-expiry">
                                        Expires at: {expiryTime} (10 min from now)
                                    </div>
                                </div>
                            </label>

                            <label className="hold-option">
                                <input
                                    type="radio"
                                    name="hold_type"
                                    value="extended_20min"
                                    checked={formData.hold_type === 'extended_20min'}
                                    onChange={handleChange}
                                />
                                <div className="option-content">
                                    <div className="option-header">
                                        <span className="option-title">Extended Hold (20 min)</span>
                                    </div>
                                    <div className="option-details">
                                        <span className="option-icon">⏱️</span>
                                        <span className="option-text">Need a bit more time</span>
                                    </div>
                                    <div className="option-expiry">
                                        Expires at: {expiryTime} (20 min from now)
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Special Instructions (Optional)</label>
                        <textarea
                            name="special_requests"
                            value={formData.special_requests}
                            onChange={handleChange}
                            placeholder="Any special needs, high chair, wheelchair access, etc."
                            rows="2"
                            maxLength="200"
                        />
                        <small className="char-count">
                            {formData.special_requests.length}/200 characters
                        </small>
                    </div>

                    <div className="hold-disclaimer">
                        <div className="disclaimer-icon">ℹ️</div>
                        <div className="disclaimer-text">
                            <strong>Note:</strong> This is a spot hold, not a guaranteed reservation. 
                            The restaurant will accommodate you based on availability when you arrive.
                            Your spot will expire automatically after the selected duration.
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            ❌ {error}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="hold-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Holding your spot...
                                </>
                            ) : (
                                'Hold My Spot Now'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationModal;