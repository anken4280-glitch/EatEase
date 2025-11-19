import React, { useState, useEffect } from "react";

export default function MyReservations({ currentUser }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = () => {
    const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const userReservations = savedReservations.filter(
      res => res.userId === currentUser.id
    );
    setReservations(userReservations);
    setLoading(false);
  };

  const cancelReservation = (reservationId) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
      const updatedReservations = savedReservations.map(res => 
        res.id === reservationId ? { ...res, status: 'cancelled' } : res
      );
      localStorage.setItem('reservations', JSON.stringify(updatedReservations));
      loadReservations();
    }
  };

  if (loading) {
    return <div className="loading">Loading reservations...</div>;
  }

  return (
    <div className="reservations-page">
      <div className="page-header">
        <h2>📅 My Reservations</h2>
        <p>Manage your upcoming restaurant bookings</p>
      </div>

      {reservations.length === 0 ? (
        <div className="no-reservations">
          <h3>No reservations yet</h3>
          <p>Make your first reservation to see it here!</p>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map(reservation => (
            <div key={reservation.id} className={`reservation-card ${reservation.status}`}>
              <div className="reservation-header">
                <h4>{reservation.restaurantName}</h4>
                <span className={`status-badge ${reservation.status}`}>
                  {reservation.status}
                </span>
              </div>
              <div className="reservation-details">
                <p><strong>Date:</strong> {reservation.date}</p>
                <p><strong>Time:</strong> {reservation.time}</p>
                <p><strong>Guests:</strong> {reservation.guests}</p>
                {reservation.specialRequests && (
                  <p><strong>Special Requests:</strong> {reservation.specialRequests}</p>
                )}
              </div>
              {reservation.status === 'confirmed' && (
                <button 
                  onClick={() => cancelReservation(reservation.id)}
                  className="cancel-btn"
                >
                  Cancel Reservation
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}