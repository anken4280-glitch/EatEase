import React, { useState, useEffect } from "react";
import "./AdminPanel.css";

function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    pendingVerifications: 0,
    totalUsers: 0,
    suspended: 0,
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const [restaurantsRes, usersRes] = await Promise.all([
        fetch("http://localhost:8000/api/admin/restaurants", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const restaurantsData = await restaurantsRes.json();
      const usersData = await usersRes.json();

      if (restaurantsData.success) {
        setRestaurants(restaurantsData.restaurants || []);
        setStats((prev) => ({
          ...prev,
          totalRestaurants: restaurantsData.count || 0,
          pendingVerifications: (
            restaurantsData.restaurants?.filter(
              (r) => r.verification_requested && !r.is_verified
            ) || []
          ).length,
          suspended: (
            restaurantsData.restaurants?.filter((r) => r.is_suspended) || []
          ).length,
        }));
      }

      if (usersData.success) {
        setUsers(usersData.users || []);
        setStats((prev) => ({ ...prev, totalUsers: usersData.count || 0 }));
      }
    } catch (error) {
      console.error("Admin data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (restaurantId) => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/verify-restaurant/${restaurantId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("✅ Restaurant verified successfully!");
        fetchVerificationRequests(); // Refresh list
        fetchAdminData(); // Refresh main data
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("❌ Failed to approve verification");
    }
  };

  const handleRejectVerification = async (restaurantId) => {
    const token = localStorage.getItem("auth_token");

    // Simple confirmation
    if (
      !window.confirm(
        "Reject this verification request?\nThe restaurant owner will be notified."
      )
    ) {
      return;
    }

    try {
      console.log("Rejecting verification for:", restaurantId);

      const response = await fetch(
        `http://localhost:8000/api/admin/reject-verification/${restaurantId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            rejection_reason: "Verification request rejected after review.",
          }),
        }
      );

      const data = await response.json();
      console.log("Reject response:", data);

      if (data.success) {
        alert("❌ Verification request rejected.");
        fetchVerificationRequests();
        fetchAdminData();
      } else {
        alert(`❌ Failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleVerifyRestaurant = async (restaurantId) => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/verify-restaurant/${restaurantId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("✅ Restaurant verified successfully!");
        fetchAdminData(); // Refresh
      }
    } catch (error) {
      console.error("Verify error:", error);
      alert("❌ Failed to verify restaurant");
    }
  };

  const handleSuspendRestaurant = async (restaurantId, reason = "") => {
    const token = localStorage.getItem("auth_token");

    if (!reason) {
      reason = prompt("Enter suspension reason (or leave empty to unsuspend):");
      if (reason === null) return; // User cancelled
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/suspend-restaurant/${restaurantId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      }
    } catch (error) {
      console.error("Suspend error:", error);
      alert("❌ Failed to update restaurant status");
    }
  };

  const fetchVerificationRequests = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        "http://localhost:8000/api/admin/verification-requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setVerificationRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Fetch verification requests error:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "verifications") {
      fetchVerificationRequests();
    }
  }, [activeTab]);

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    const token = localStorage.getItem("auth_token");
    try {
      // You'll need to create this endpoint
      const response = await fetch(
        `http://localhost:8000/api/admin/delete-user/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("User deleted successfully");
        fetchAdminData();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>EatEase</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={activeTab === "verifications" ? "active" : ""}
          onClick={() => setActiveTab("verifications")}
        >
          Verifications
        </button>
        <button
          className={activeTab === "restaurants" ? "active" : ""}
          onClick={() => setActiveTab("restaurants")}
        >
          Restaurants
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>

        <button
          className="refresh-btn"
          onClick={fetchAdminData}
          title="Refresh data"
        >
          Refresh
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-view">
            <h2>Overview</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <h3>Total Restaurants</h3>
                  <p className="stat-number">{stats.totalRestaurants}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <h3>Pending Verifications</h3>
                  <p className="stat-number">{stats.pendingVerifications}</p>
                  {stats.pendingVerifications > 0 && (
                    <button
                      className="small-btn"
                      onClick={() => setActiveTab("restaurants")}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats.totalUsers}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <h3>Suspended</h3>
                  <p className="stat-number">{stats.suspended}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="quick-action-buttons">
                <button onClick={() => setActiveTab("restaurants")}>
                  Manage Restaurants
                </button>
                <button onClick={() => setActiveTab("users")}>
                  View Users
                </button>
                <button
                  onClick={() =>
                    window.open("http://localhost/phpmyadmin", "_blank")
                  }
                >
                  Open Database
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "restaurants" && (
          <div className="restaurants-view">
            <div className="view-header">
              <h2>Restaurant Management</h2>
              <div className="filters">
                <button>Suspended</button>
              </div>
            </div>

            <div className="restaurants-list">
              {restaurants.length === 0 ? (
                <div className="empty-state">
                  <p>No restaurants found in the system.</p>
                </div>
              ) : (
                restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="admin-restaurant-card">
                    {/* RESTAURANT NAME */}
                    <h3 className="restaurant-title">{restaurant.name}</h3>

                    {/* RESTAURANT INFO */}
                    <div className="restaurant-info-grid">
                      <div className="info-item">
                        <span className="info-label">Owner:</span>
                        <span className="info-value">
                          {restaurant.owner_name}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Address:</span>
                        <span className="info-value">{restaurant.address}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Cuisine:</span>
                        <span className="info-value">
                          {restaurant.cuisine_type}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{restaurant.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Capacity:</span>
                        <span className="info-value">
                          {restaurant.current_occupancy}/
                          {restaurant.max_capacity}
                          <span className="occupancy-percent">
                            (
                            {Math.round(
                              (restaurant.current_occupancy /
                                restaurant.max_capacity) *
                                100
                            )}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span
                          className={`status-badge ${restaurant.crowd_status}`}
                        >
                          {restaurant.crowd_status}
                        </span>
                      </div>
                    </div>

                    {/* VERIFICATION STATUS */}
                    <div className="verification-status-row">
                      {restaurant.is_verified ? (
                        <span className="verified-badge">✅ Verified</span>
                      ) : restaurant.verification_requested ? (
                        <span className="pending-badge">
                          ⏳ Verification Requested
                        </span>
                      ) : (
                        <span className="not-verified-badge">
                          ⚠️ Not Verified
                        </span>
                      )}

                      {restaurant.is_featured && (
                        <span className="featured-badge">✨ Featured</span>
                      )}

                      {restaurant.is_suspended && (
                        <span className="suspended-badge">🚫 Suspended</span>
                      )}
                    </div>

                    {/* ADMIN ACTIONS */}
                    <div className="admin-action-buttons">
                      {!restaurant.is_verified && (
                        <button
                          className="action-btn verify-btn"
                          onClick={() => handleVerifyRestaurant(restaurant.id)}
                        >
                          Verify
                        </button>
                      )}

                      <button
                        className={`action-btn ${
                          restaurant.is_suspended
                            ? "unsuspend-btn"
                            : "suspend-btn"
                        }`}
                        onClick={() => handleSuspendRestaurant(restaurant.id)}
                      >
                        {restaurant.is_suspended
                          ? "Unsuspend"
                          : "Suspend"}
                      </button>

                      <button
                        className="action-btn view-btn"
                        onClick={() =>
                          window.open(`/restaurant/${restaurant.id}`, "_blank")
                        }
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-view">
            <h2>User Management</h2>
            <div className="users-list">
              {users.length === 0 ? (
                <div className="empty-state">
                  <p>No users found in the system.</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="admin-user-card">
                    <div className="user-header">
                      <h3>{user.name}</h3>
                      <div className="user-badges">
                        <span className={`type-badge ${user.user_type}`}>
                          {user.user_type}
                        </span>
                        {user.is_admin && (
                          <span className="admin-badge">👑 Admin</span>
                        )}
                      </div>
                    </div>

                    <div className="user-details">
                      <p>
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p>
                        <strong>User ID:</strong> {user.id}
                      </p>
                      <p>
                        <strong>Joined:</strong>{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "verifications" && (
          <div className="verifications-tab">
            <div className="tab-header">
              <h2>Verification Requests</h2>
              <div className="header-actions">
                <button
                  onClick={fetchVerificationRequests}
                  className="refresh-small"
                >
                  Refresh
                </button>
              </div>
            </div>

            {verificationRequests.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">🎉</div>
                <h3>No Pending Requests</h3>
                <p>All verification requests have been processed.</p>
                <button onClick={fetchVerificationRequests}>Check Again</button>
              </div>
            ) : (
              <div className="verification-grid">
                {/* FIX 3 CODE STARTS HERE */}
                {verificationRequests.map((request) => (
                  <div key={request.id} className="verification-card">
                    {/* 1. RESTAURANT NAME (BIG) */}
                    <h2 className="restaurant-title">{request.name}</h2>

                    {/* 2. OWNER NAME */}
                    <div className="owner-section">
                      <span className="owner-name">
                        {request.owner?.name || "Unknown Owner"}
                      </span>
                    </div>

                    {/* 3. VIEW RESTAURANT BUTTON */}
                    <button
                      className="view-btn"
                      onClick={() =>
                        window.open(`/restaurant/${request.id}`, "_blank")
                      }
                    >
                      View Restaurant
                    </button>

                    {/* 4. VERIFICATION REASON BOX */}
                    <div className="verification-reason-section">
                      <div className="reason-text-box">
                        {request.admin_notes || "No details provided by owner"}
                      </div>
                    </div>

                    {/* 5. DECISION BUTTONS */}
                    <div className="decision-buttons">
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectVerification(request.id)}
                      >
                        Reject
                      </button>
                      <button
                        className="approve-btn"
                        onClick={() => handleApproveVerification(request.id)}
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="admin-footer">
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;
