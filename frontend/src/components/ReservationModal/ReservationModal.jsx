import React, { useState } from "react";
import './ReservationModal.css';

export default function ReservationModal({ restaurant, isOpen, onClose, currentUser }) {
  const [reservation, setReservation] = useState({
    date: "",
    time: "",
    guests: 2,
    specialRequests: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Generate time slots from 11 AM to 10 PM
  const timeSlots = [
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", 
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
    "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
    "9:00 PM", "9:30 PM", "10:00 PM"
  ];

  // Get tomorrow's date for the minimum date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to make a reservation");
      return;
    }

    setLoading(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save reservation to localStorage (mock)
      const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
      const newReservation = {
        id: Date.now(),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        userId: currentUser.id,
        userName: currentUser.name,
        ...reservation,
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      };
      
      reservations.push(newReservation);
      localStorage.setItem('reservations', JSON.stringify(reservations));
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReservation({ date: "", time: "", guests: 2, specialRequests: "" });
      }, 2000);
    } catch (error) {
      alert("Failed to make reservation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setReservation({
      ...reservation,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen || !restaurant) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content reservation-modal">
        <div className="modal-header">
          <h3>📅 Make a Reservation</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="restaurant-info">
          <h4>{restaurant.name}</h4>
          <p className="cuisine">{restaurant.cuisine}</p>
          <div className="current-status">
            <span className={`status-${restaurant.status}`}>
              {restaurant.crowdLevel} Crowd • Wait: {restaurant.waitTime}min
            </span>
          </div>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h4>Reservation Confirmed!</h4>
            <p>Your table at {restaurant.name} is reserved for {reservation.date} at {reservation.time}</p>
            <p>We've sent a confirmation to your email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reservation-form">
            <div className="form-group">
              <label>📅 Date</label>
              <input
                type="date"
                name="date"
                value={reservation.date}
                onChange={handleChange}
                min={getTomorrowDate()}
                required
              />
            </div>

            <div className="form-group">
              <label>🕒 Time</label>
              <select
                name="time"
                value={reservation.time}
                onChange={handleChange}
                required
              >
                <option value="">Select a time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>👥 Number of Guests</label>
              <select
                name="guests"
                value={reservation.guests}
                onChange={handleChange}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>💬 Special Requests (Optional)</label>
              <textarea
                name="specialRequests"
                value={reservation.specialRequests}
                onChange={handleChange}
                placeholder="Any special requirements? (e.g., birthday celebration, allergies, wheelchair access...)"
                rows="3"
              />
            </div>

            <div className="reservation-summary">
              <h5>Reservation Summary:</h5>
              <div className="summary-details">
                <p><strong>Restaurant:</strong> {restaurant.name}</p>
                <p><strong>Date:</strong> {reservation.date || 'Not selected'}</p>
                <p><strong>Time:</strong> {reservation.time || 'Not selected'}</p>
                <p><strong>Guests:</strong> {reservation.guests}</p>
                {reservation.specialRequests && (
                  <p><strong>Requests:</strong> {reservation.specialRequests}</p>
                )}
              </div>
            </div>

            <div className="form-buttons">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || !reservation.date || !reservation.time}
              >
                {loading ? "Making Reservation..." : "Confirm Reservation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}