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
      const response = await fetch(
        "http://localhost/EatEase-Backend/backend/public/api/reservations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Process reservations to check for expired holds
          const processedReservations = (
            data.reservations?.data ||
            data.reservations ||
            []
          ).map((res) => {
            // Check if this is an expired hold
            if (res.status === "pending_hold" && res.expires_at) {
              const expiresAt = new Date(res.expires_at);
              const now = new Date();
              if (expiresAt < now) {
                return { ...res, status: "expired" };
              }
            }
            return res;
          });

          setReservations(processedReservations);
        }
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    try {
      // Handle different date formats - FIXED for 2026-01-25T00:00:00.000000Z format
      let dateStr = date;
      let timeStr = time;

      // If date is in ISO format with timezone (like 2026-01-25T00:00:00.000000Z)
      if (dateStr && dateStr.includes("T")) {
        // Extract just the date part (before T)
        const datePart = dateStr.split("T")[0];
        const dateObj = new Date(datePart);

        // If we have a specific time, add it
        if (timeStr && timeStr !== "00:00:00" && timeStr !== "00:00") {
          // Parse the time
          const [hours, minutes] = timeStr.split(":").map(Number);
          dateObj.setHours(hours, minutes || 0, 0);
        }

        if (isNaN(dateObj.getTime())) {
          console.warn("Invalid date after processing:", date, time);
          return "Scheduled";
        }

        return dateObj.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }

      // Regular date parsing
      const dateObj = new Date(`${dateStr}T${timeStr || "00:00"}`);

      if (isNaN(dateObj.getTime())) {
        console.warn("Invalid date:", date, time);
        return "Scheduled";
      }

      return dateObj.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Scheduled";
    }
  };

  const formatStatus = (status, expiresAt) => {
    // Check if hold is expired
    if (status === "pending_hold" && expiresAt) {
      const expiresDate = new Date(expiresAt);
      const now = new Date();
      if (expiresDate < now) {
        return "expired";
      }
    }

    // Map status to display names
    const statusMap = {
      pending: "Pending",
      pending_hold: "Pending Hold",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      completed: "Completed",
      no_show: "No Show",
      expired: "Expired",
      rejected: "Rejected",
    };

    return statusMap[status] || status;
  };

  const getStatusClass = (status, expiresAt) => {
    // Check if hold is expired
    if (status === "pending_hold" && expiresAt) {
      const expiresDate = new Date(expiresAt);
      const now = new Date();
      if (expiresDate < now) {
        return "expired";
      }
    }

    return status;
  };

  const formatHoldExpiry = (expiresAt) => {
    if (!expiresAt) return "";

    try {
      const expiresDate = new Date(expiresAt);
      const now = new Date();

      // Check if expired
      if (expiresDate < now) {
        return "Expired";
      }

      // Calculate time remaining
      const diffMs = expiresDate - now;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;

      if (diffHours > 0) {
        return `Expires in ${diffHours}h ${remainingMins}m`;
      } else {
        return `Expires in ${diffMins}m`;
      }
    } catch (error) {
      return "";
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this reservation?")) return;

    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost/EatEase-Backend/backend/public/api/reservations/${id}`,
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

  const handleRemove = async (id) => {
    if (!confirm("Remove this reservation from your list?")) return;

    // Since we don't have a delete endpoint for users to remove their own reservations,
    // we'll just remove it from the frontend state
    // Alternatively, you could mark it as "hidden" in the backend

    setReservations((prev) => prev.filter((res) => res.id !== id));

    // Optional: If you want to actually delete from backend, add an API endpoint
    // const token = localStorage.getItem("auth_token");
    // try {
    //   const response = await fetch(
    //     `http://localhost/EatEase-Backend/backend/public/api/reservations/${id}/remove`,
    //     {
    //       method: "DELETE",
    //       headers: { Authorization: `Bearer ${token}` },
    //     }
    //   );
    // } catch (error) {
    //   console.error("Error removing:", error);
    // }
  };

  // Check if reservation can be removed (cancelled, rejected, or expired)
  const canRemoveReservation = (reservation) => {
    const removableStatuses = ["cancelled", "expired", "rejected"];
    return removableStatuses.includes(reservation.status);
  };

  return (
    <div className="reservations-page">
      <div className="page-header">
        <button className="reservations-back-button" onClick={onBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 -960 960 960"
            width="24"
          >
            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
          </svg>
        </button>
        <h1>
          {" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="black"
          >
            <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
          </svg>
          My Reservations
        </h1>
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
          {reservations.map((res) => {
            const displayStatus = formatStatus(res.status, res.expires_at);
            const statusClass = getStatusClass(res.status, res.expires_at);
            const canRemove = canRemoveReservation(res);

            return (
              <div key={res.id} className="reservation-card">
                <div className="reservation-header">
                  <div className="header-left">
                    <h3>{res.restaurant?.name || "Restaurant"}</h3>
                  </div>

                  <div className="header-right">
                    <div className="status-container">
                      <span className={`status ${statusClass}`}>
                        {displayStatus}
                      </span>
                      {res.expires_at && displayStatus === "Pending Hold" && (
                        <span className="expiry-info">
                          {formatHoldExpiry(res.expires_at)}
                        </span>
                      )}
                    </div>

                    {canRemove && (
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(res.id)}
                        title="Remove from list"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="20"
                          viewBox="0 -960 960 960"
                          width="20"
                        >
                          <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="reservation-details">
                  <div className="detail-item">
                    <span className="detail-label">Date & Time:</span>
                    <span className="detail-value">
                      {formatDateTime(
                        res.reservation_date,
                        res.reservation_time,
                      )}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Party Size:</span>
                    <span className="detail-value">
                      {res.party_size} people
                    </span>
                  </div>

                  {res.confirmation_code && (
                    <div className="detail-item">
                      <span className="detail-label">Confirmation Code:</span>
                      <span className="detail-value code">
                        {res.confirmation_code}
                      </span>
                    </div>
                  )}

                  {res.hold_type && (
                    <div className="detail-item">
                      <span className="detail-label">Hold Type:</span>
                      <span className="detail-value">
                        {res.hold_type === "quick_10min"
                          ? "10-minute Quick Hold"
                          : "20-minute Extended Hold"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="reservation-actions">
                  {(res.status === "confirmed" || res.status === "pending") && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancel(res.id)}
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;
