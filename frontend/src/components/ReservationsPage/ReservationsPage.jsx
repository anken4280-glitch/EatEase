import React, { useState, useEffect } from "react";
import "./ReservationsPage.css";

const ReservationsPage = ({ user, onBack }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/reservations', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReservations(data.reservations?.data || data.reservations || []);
        }
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this reservation?")) return;

    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost:8000/api/reservations/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        alert("Reservation cancelled");
        fetchReservations();
      }
    } catch (error) {
      console.error("Error cancelling:", error);
    }
  };

  return (
    <div className="reservations-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 -960 960 960"
            width="24"
          >
            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
          </svg>
        </button>
        <h1>📅 My Reservations</h1>
      </div>

      {loading ? (
        <div className="loading">Loading reservations...</div>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Reservations Yet</h3>
          <p>Your upcoming reservations will appear here</p>
          <button
            className="browse-btn"
            onClick={() => (window.location.href = "/")}
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map((res) => (
            <div key={res.id} className="reservation-card">
              <div className="reservation-header">
                <h3>{res.restaurant?.name || "Restaurant"}</h3>
                <span className={`status ${res.status}`}>{res.status}</span>
              </div>

              <div className="reservation-details">
                <p>
                  📅{" "}
                  {formatDateTime(res.reservation_date, res.reservation_time)}
                </p>
                <p>👥 Party of {res.party_size}</p>
                {res.confirmation_code && (
                  <p>🔑 Code: {res.confirmation_code}</p>
                )}
                {res.special_requests && (
                  <p className="requests">📝 {res.special_requests}</p>
                )}
              </div>

              {res.status === "confirmed" && (
                <button
                  className="cancel-btn"
                  onClick={() => handleCancel(res.id)}
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
};

export default ReservationsPage;
