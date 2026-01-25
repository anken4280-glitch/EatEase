import React, { useState, useEffect } from "react";
import "./SpotHoldManagement.css";

const SpotHoldManagement = ({ restaurant }) => {
  const [activeHolds, setActiveHolds] = useState([]);
  const [todaysReservations, setTodaysReservations] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(restaurant);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // active, today, expired
  const [capacityInfo, setCapacityInfo] = useState({
    current: restaurant?.current_occupancy || 0,
    max: restaurant?.max_capacity || 100,
  });

  useEffect(() => {
    if (restaurant) {
      setCapacityInfo({
        current: restaurant.current_occupancy || 0,
        max: restaurant.max_capacity || 100,
      });
      fetchData();

      // Refresh every 30 seconds for real-time updates
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, restaurant]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === "active") {
        await fetchActiveHolds();
      } else if (activeTab === "today") {
        await fetchTodaysReservations();
      } else if (activeTab === "expired") {
        await fetchExpiredHolds();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem("auth_token");
    const baseUrl = "http://localhost/EatEase-Backend/backend/public";
    const url = `${baseUrl}/api${endpoint}`;

    console.log("API Call:", url); // Debug log

    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    console.log("Response Status:", response.status);

    return response.json();
  };

  const fetchActiveHolds = async () => {
    try {
      console.log("Fetching active holds...");
      const data = await fetchWithAuth("/my-restaurant/spot-holds");
      console.log("Active holds response:", data);

      if (data.success) {
        setActiveHolds(data.spot_holds || []);
      } else {
        console.error("API returned false success:", data);
      }
    } catch (error) {
      console.error("Error fetching active holds:", error);
    }
  };

  const fetchTodaysReservations = async () => {
    try {
      const data = await fetchWithAuth("/my-restaurant/todays-reservations");
      if (data.success) {
        setTodaysReservations(data.reservations || []);
      }
    } catch (error) {
      console.error("Error fetching today's reservations:", error);
    }
  };

  const fetchExpiredHolds = async () => {
    try {
      const data = await fetchWithAuth("/my-restaurant/spot-holds/expired");
      if (data.success) {
        setActiveHolds(data.expired_holds || []);
      }
    } catch (error) {
      console.error("Error fetching expired holds:", error);
    }
  };

  const handleAcceptHold = async (holdId) => {
    if (
      !window.confirm(
        "Accept this spot hold? This will confirm the reservation.",
      )
    )
      return;

    try {
      const data = await fetchWithAuth(
        `/my-restaurant/spot-holds/${holdId}/accept`,
        {
          method: "PUT",
        },
      );

      if (data.success) {
        alert("✅ Spot hold accepted! Reservation confirmed.");
        fetchData(); // Refresh all data

        // Update capacity from response if available
        if (data.restaurant_occupancy) {
          setCapacityInfo({
            current: data.restaurant_occupancy.current,
            max: data.restaurant_occupancy.max,
          });
        }
      } else {
        alert(`❌ ${data.message || "Failed to accept hold"}`);
      }
    } catch (error) {
      console.error("Error accepting hold:", error);
      alert("Error accepting spot hold");
    }
  };

  const handleRejectHold = async (holdId) => {
    if (!window.confirm("Reject this spot hold?")) return;

    try {
      const data = await fetchWithAuth(
        `/my-restaurant/spot-holds/${holdId}/reject`,
        {
          method: "PUT",
        },
      );

      if (data.success) {
        alert("Spot hold rejected.");
        fetchData(); // Refresh data
      } else {
        alert(data.message || "Failed to reject hold");
      }
    } catch (error) {
      console.error("Error rejecting hold:", error);
      alert("Error rejecting spot hold");
    }
  };

  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return "Expired";
    if (minutes < 60) return `${minutes}m remaining`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m remaining`;
  };

  const getHoldTypeLabel = (type) => {
    switch (type) {
      case "quick_10min":
        return "10-min Quick Hold";
      case "extended_20min":
        return "20-min Extended Hold";
      default:
        return type;
    }
  };

  const calculateAvailableCapacity = () => {
    return capacityInfo.max - capacityInfo.current;
  };

  return (
    <div className="spot-hold-management">
      {/* Header with Restaurant Info */}
      <div className="management-header">
        <div>
          <h1>Spot Hold Management</h1>
          {restaurantInfo && (
            <p className="restaurant-name">{restaurantInfo.name}</p>
          )}
        </div>

        {/* Capacity Status */}
        <div className="capacity-status">
          <div className="capacity-bar">
            <div className="capacity-label">
              Capacity: {capacityInfo.current}/{capacityInfo.max}
            </div>
            <div className="capacity-progress">
              <div
                className="capacity-fill"
                style={{
                  width: `${(capacityInfo.current / capacityInfo.max) * 100}%`,
                  backgroundColor:
                    capacityInfo.current >= capacityInfo.max * 0.9
                      ? "var(--red-status)"
                      : capacityInfo.current >= capacityInfo.max * 0.7
                        ? "var(--orange-status)"
                        : "var(--green-status)",
                }}
              ></div>
            </div>
          </div>
          <div className="available-capacity">
            Available: {calculateAvailableCapacity()} seats
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="management-tabs">
        <button
          className={`tab ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active Holds
          {activeTab === "active" && activeHolds.length > 0 && (
            <span className="tab-badge">{activeHolds.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === "today" ? "active" : ""}`}
          onClick={() => setActiveTab("today")}
        >
          Today's Reservations
        </button>
        <button
          className={`tab ${activeTab === "expired" ? "active" : ""}`}
          onClick={() => setActiveTab("expired")}
        >
          Expired Holds
        </button>
      </div>

      {/* Content Area */}
      <div className="management-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === "active" && (
              <ActiveHoldsView
                holds={activeHolds}
                onAccept={handleAcceptHold}
                onReject={handleRejectHold}
                formatTimeRemaining={formatTimeRemaining}
                getHoldTypeLabel={getHoldTypeLabel}
                availableCapacity={calculateAvailableCapacity()}
              />
            )}

            {activeTab === "today" && (
              <TodaysReservationsView reservations={todaysReservations} />
            )}

            {activeTab === "expired" && (
              <ExpiredHoldsView
                holds={activeHolds}
                getHoldTypeLabel={getHoldTypeLabel}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Sub-component: Active Holds
const ActiveHoldsView = ({
  holds,
  onAccept,
  onReject,
  formatTimeRemaining,
  getHoldTypeLabel,
  availableCapacity,
}) => {
  if (holds.length === 0) {
    return (
      <div className="empty-state">
        <p>No active spot holds</p>
        <p className="empty-subtitle">
          When diners request spot holds, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="holds-list">
      {holds.map((hold) => {
        const isExpired = hold.time_remaining <= 0;
        const canAccept = !isExpired && hold.party_size <= availableCapacity;

        return (
          <div
            key={hold.id}
            className={`hold-card ${isExpired ? "expired" : ""}`}
          >
            <div className="hold-header">
              <div className="hold-user">
                <span className="user-name">
                  {hold.user?.name || "Customer"}
                </span>
                <span className="user-email">{hold.user?.email}</span>
              </div>
              <div className="hold-meta">
                <span className="party-size">
                  {hold.party_size} person{hold.party_size !== 1 ? "s" : ""}
                </span>
                <span className="hold-type">
                  {getHoldTypeLabel(hold.hold_type)}
                </span>
                <span className="confirmation-code">
                  Code: {hold.confirmation_code}
                </span>
              </div>
            </div>

            <div className="hold-details">
              <div className="time-info">
                <div className="time-remaining">
                  <span className="time-label">Time Remaining:</span>
                  <span className={`time-value ${isExpired ? "expired" : ""}`}>
                    {formatTimeRemaining(hold.time_remaining)}
                  </span>
                </div>
                <div className="expires-at">
                  Expires:{" "}
                  {new Date(hold.expires_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {hold.special_requests && (
                <div className="special-requests">
                  <strong>Special Requests:</strong> {hold.special_requests}
                </div>
              )}
            </div>

            <div className="hold-actions">
              {!isExpired ? (
                <>
                  <button
                    className="btn-accept"
                    onClick={() => onAccept(hold.id)}
                    disabled={!canAccept}
                    title={
                      !canAccept
                        ? "Not enough capacity"
                        : "Accept this spot hold"
                    }
                  >
                    ✅ Accept Hold
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => onReject(hold.id)}
                  >
                    ❌ Reject
                  </button>
                </>
              ) : (
                <span className="expired-label">⏰ Hold Expired</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Sub-component: Today's Reservations
const TodaysReservationsView = ({ reservations }) => {
  if (reservations.length === 0) {
    return (
      <div className="empty-state">
        <p>No confirmed reservations for today</p>
      </div>
    );
  }

  return (
    <div className="reservations-list">
      <table className="reservations-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Customer</th>
            <th>Party Size</th>
            <th>Contact</th>
            <th>Confirmation Code</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((res) => (
            <tr key={res.id}>
              <td>{res.reservation_time}</td>
              <td>{res.user?.name || "Customer"}</td>
              <td>{res.party_size}</td>
              <td>
                <div>{res.user?.email}</div>
                {res.user?.phone && <div>{res.user.phone}</div>}
              </td>
              <td>
                <code>{res.confirmation_code}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Sub-component: Expired Holds
const ExpiredHoldsView = ({ holds, getHoldTypeLabel }) => {
  if (holds.length === 0) {
    return (
      <div className="empty-state">
        <p>No expired holds</p>
      </div>
    );
  }

  return (
    <div className="expired-holds">
      {holds.map((hold) => (
        <div key={hold.id} className="expired-hold-card">
          <div className="expired-hold-header">
            <span className="customer-name">
              {hold.user?.name || "Customer"}
            </span>
            <span className="hold-type">
              {getHoldTypeLabel(hold.hold_type)}
            </span>
            <span className="party-size">{hold.party_size}p</span>
          </div>
          <div className="expired-hold-details">
            <div>Expired: {new Date(hold.expires_at).toLocaleString()}</div>
            <div>Code: {hold.confirmation_code}</div>
            {hold.special_requests && (
              <div>Requests: {hold.special_requests}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpotHoldManagement;
