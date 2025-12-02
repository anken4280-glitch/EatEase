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

  const handleRejectVerification = async (restaurantId, reason) => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/reject-verification/${restaurantId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rejection_reason: reason }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("❌ Verification request rejected");
        fetchVerificationRequests();
        fetchAdminData();
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject verification");
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
        <h1>👮‍♂️ EatEase Admin Panel</h1>
        <p>
          Welcome, {user.name} ({user.email})
        </p>
        <small>Last updated: {new Date().toLocaleTimeString()}</small>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === "verifications" ? "active" : ""}
          onClick={() => setActiveTab("verifications")}
        >
          ✅ Verifications ({stats.pendingVerifications || 0})
        </button>
        <button
          className={activeTab === "restaurants" ? "active" : ""}
          onClick={() => setActiveTab("restaurants")}
        >
          🏪 Restaurants ({stats.totalRestaurants})
        </button>
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({stats.totalUsers})
        </button>

        <button
          className="refresh-btn"
          onClick={fetchAdminData}
          title="Refresh data"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-view">
            <h2>📈 System Overview</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏪</div>
                <div className="stat-info">
                  <h3>Total Restaurants</h3>
                  <p className="stat-number">{stats.totalRestaurants}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
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
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats.totalUsers}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <h3>Suspended</h3>
                  <p className="stat-number">{stats.suspended}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>⚡ Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab("restaurants")}>
                  Manage Restaurants
                </button>
                <button onClick={() => setActiveTab("users")}>
                  Manage Users
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
              <h2>🏪 Restaurant Management</h2>
              <div className="filters">
                <button
                  className={!stats.pendingVerifications ? "disabled" : ""}
                >
                  Pending Verification ({stats.pendingVerifications})
                </button>
                <button>All Restaurants</button>
                <button>Suspended ({stats.suspended})</button>
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
                    <div className="restaurant-header">
                      <div>
                        <h3>{restaurant.name}</h3>
                        <p className="restaurant-meta">
                          {restaurant.cuisine_type} • {restaurant.address}
                        </p>
                      </div>
                      <div className="status-badges">
                        {restaurant.is_verified ? (
                          <span
                            className="badge verified"
                            title="Verified restaurant"
                          >
                            ✅ Verified
                          </span>
                        ) : (
                          <span className="badge pending" title="Not verified">
                            ⏳ Pending
                          </span>
                        )}
                        {restaurant.is_suspended && (
                          <span className="badge suspended" title="Suspended">
                            ⚠️ Suspended
                          </span>
                        )}
                        {restaurant.is_featured && (
                          <span className="badge featured" title="Featured">
                            ✨ Featured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="restaurant-details">
                      <div className="detail-row">
                        <span>
                          <strong>Owner:</strong> {restaurant.owner_name} (ID:{" "}
                          {restaurant.owner_id})
                        </span>
                        <span>
                          <strong>Capacity:</strong>{" "}
                          {restaurant.current_occupancy}/
                          {restaurant.max_capacity}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>
                          <strong>Status:</strong> {restaurant.crowd_status}
                        </span>
                        <span>
                          <strong>Created:</strong>{" "}
                          {new Date(restaurant.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="admin-actions">
                      {!restaurant.is_verified && (
                        <button
                          className="action-btn verify-btn"
                          onClick={() => handleVerifyRestaurant(restaurant.id)}
                          title="Verify this restaurant"
                        >
                          ✅ Verify
                        </button>
                      )}

                      <button
                        className={`action-btn ${
                          restaurant.is_suspended
                            ? "unsuspend-btn"
                            : "suspend-btn"
                        }`}
                        onClick={() => handleSuspendRestaurant(restaurant.id)}
                        title={
                          restaurant.is_suspended
                            ? "Unsuspend restaurant"
                            : "Suspend restaurant"
                        }
                      >
                        {restaurant.is_suspended
                          ? "🔄 Unsuspend"
                          : "⚠️ Suspend"}
                      </button>

                      <button
                        className="action-btn delete-btn"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Permanently delete "${restaurant.name}"?`
                            )
                          ) {
                            // Implement delete
                            alert("Delete endpoint not implemented yet");
                          }
                        }}
                        title="Delete restaurant"
                      >
                        🗑️ Delete
                      </button>

                      <button
                        className="action-btn view-btn"
                        onClick={() =>
                          alert("View details - to be implemented")
                        }
                        title="View restaurant details"
                      >
                        👁️ View
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
            <h2>👥 User Management</h2>

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
                      <p>
                        <strong>Last Active:</strong>{" "}
                        {new Date(user.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="user-actions">
                      {!user.is_admin && (
                        <>
                          <button
                            className="small-btn"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete user"
                          >
                            Delete
                          </button>
                          <button
                            className="small-btn"
                            onClick={() => {
                              if (
                                window.confirm(`Make ${user.name} an admin?`)
                              ) {
                                alert(
                                  "Make admin endpoint not implemented yet"
                                );
                              }
                            }}
                            title="Make admin"
                          >
                            Make Admin
                          </button>
                        </>
                      )}
                      <button
                        className="small-btn"
                        onClick={() =>
                          alert("View user details - to be implemented")
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

        {activeTab === "verifications" && (
          <div className="verifications-tab">
            <h2>✅ Verification Requests</h2>

            {verificationRequests.length === 0 ? (
              <div className="empty-state">
                <p>No pending verification requests! 🎉</p>
              </div>
            ) : (
              <div className="verification-requests-list">
                {verificationRequests.map((request) => (
                  <div key={request.id} className="verification-request-card">
                    <div className="request-header">
                      <h3>{request.name}</h3>
                      <span className="request-date">
                        Requested:{" "}
                        {new Date(
                          request.verification_requested_at
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="request-details">
                      <p>
                        <strong>Owner:</strong>{" "}
                        {request.owner?.name || "Unknown"} (
                        {request.owner?.email})
                      </p>
                      <p>
                        <strong>Cuisine:</strong> {request.cuisine_type}
                      </p>
                      <p>
                        <strong>Address:</strong> {request.address}
                      </p>

                      <div className="verification-text">
                        <strong>Verification Request:</strong>
                        <div className="text-box">
                          {request.verification_request}
                        </div>
                      </div>

                      <div className="request-actions">
                        <button
                          className="approve-btn"
                          onClick={() => handleApproveVerification(request.id)}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason)
                              handleRejectVerification(request.id, reason);
                          }}
                        >
                          ❌ Reject
                        </button>
                        <button
                          className="view-btn"
                          onClick={() =>
                            window.open(`/restaurant/${request.id}`, "_blank")
                          }
                        >
                          👁️ View Restaurant
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="admin-footer">
        <p>EatEase Admin Panel • v1.0 • {new Date().toLocaleDateString()}</p>
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;
