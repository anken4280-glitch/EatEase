import React, { useState, useEffect } from "react";
import "./AdminPanel.css";

function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]); // NEW
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    pendingVerifications: 0,
    totalUsers: 0,
    suspendedRestaurants: 0,
    pendingFeatureRequests: 0, // NEW
    featuredRestaurants: 0, // NEW
  });

  const token = localStorage.getItem("auth_token");

  const tabs = ["Dashboard", "Verifications", "Feature Requests", "Restaurants", "Users"]; // UPDATED

  // Fetch all data
  useEffect(() => {
    if (activeTab === "Dashboard") {
      fetchDashboardStats();
    } else if (activeTab === "Verifications") {
      fetchVerificationRequests();
    } else if (activeTab === "Feature Requests") { // NEW
      fetchFeatureRequests();
      fetchFeaturedRestaurantsCount();
    } else if (activeTab === "Restaurants") {
      fetchRestaurants();
    } else if (activeTab === "Users") {
      fetchUsers();
    }
  }, [activeTab]);

  // ========== DASHBOARD ==========
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch all data for dashboard
      const [verificationsRes, restaurantsRes, usersRes, featureRes] = await Promise.all([
        fetch("http://localhost:8000/api/admin/verification-requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/api/admin/restaurants", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/api/admin/feature-requests", { // NEW
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const verificationsData = await verificationsRes.json();
      const restaurantsData = await restaurantsRes.json();
      const usersData = await usersRes.json();
      const featureData = await featureRes.json();

      // Count featured restaurants
      const featuredCount = restaurantsData.restaurants?.filter(r => r.is_featured)?.length || 0;

      setStats({
        totalRestaurants: restaurantsData.restaurants?.length || 0,
        pendingVerifications: verificationsData.verification_requests?.length || 0,
        totalUsers: usersData.users?.length || 0,
        suspendedRestaurants: restaurantsData.restaurants?.filter(r => r.is_suspended)?.length || 0,
        pendingFeatureRequests: featureData.feature_requests?.length || 0, // NEW
        featuredRestaurants: featuredCount, // NEW
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========== FEATURE REQUESTS ========== (NEW)
  const fetchFeatureRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/feature-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFeatureRequests(data.feature_requests || []);
      }
    } catch (error) {
      console.error("Error fetching feature requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedRestaurantsCount = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const featuredCount = data.restaurants?.filter(r => r.is_featured)?.length || 0;
        setStats(prev => ({ ...prev, featuredRestaurants: featuredCount }));
      }
    } catch (error) {
      console.error("Error fetching featured count:", error);
    }
  };

  const handleApproveFeature = async (requestId, restaurantId) => {
  if (stats.featuredRestaurants >= 10) {
    alert("❌ Maximum of 10 featured restaurants reached! Please remove some before adding new ones.");
    return;
  }

  if (!confirm("Approve this feature request? The restaurant will appear in featured section.")) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/api/admin/approve-feature-request/${requestId}`, {
      method: "POST",
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
      // No body needed
    });
    
    const data = await response.json();
    if (data.success) {
      alert("✅ Feature request approved! Restaurant is now featured.");
      fetchFeatureRequests();
      fetchFeaturedRestaurantsCount();
    } else {
      alert("Failed to approve: " + (data.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Error approving feature:", error);
    alert("Failed to approve feature request. Please try again.");
  }
};

const handleRejectFeature = async (requestId) => {
  if (!confirm("Are you sure you want to reject this feature request?")) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:8000/api/admin/reject-feature-request/${requestId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
      // No body needed since we're not sending a reason
    });
    
    const data = await response.json();
    if (data.success) {
      alert('❌ Feature request rejected.');
      fetchFeatureRequests(); // Refresh list
    } else {
      alert('Failed to reject: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error rejecting feature:', error);
    alert('Failed to reject feature request. Please try again.');
  }
};

  const handleRemoveFromFeatured = async (restaurantId) => {
    if (!confirm("Remove this restaurant from featured section?")) {
      return;
    }

    try {
      // First, get the restaurant
      const restaurantRes = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}`);
      const restaurantData = await restaurantRes.json();
      
      if (restaurantData.success) {
        // Update restaurant to not be featured
        const updateRes = await fetch("http://localhost:8000/api/restaurant/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...restaurantData.restaurant,
            is_featured: false,
            featured_description: null,
          }),
        });
        
        const updateData = await updateRes.json();
        if (updateData.success) {
          alert("✅ Restaurant removed from featured section.");
          fetchFeatureRequests();
          fetchFeaturedRestaurantsCount();
        }
      }
    } catch (error) {
      console.error("Error removing from featured:", error);
    }
  };

  // ========== VERIFICATIONS ==========
  const fetchVerificationRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/verification-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setVerificationRequests(data.verification_requests || []);
      }
    } catch (error) {
      console.error("Error fetching verification requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (restaurantId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/verify-restaurant/${restaurantId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        alert("✅ Verification approved!");
        fetchVerificationRequests();
      }
    } catch (error) {
      console.error("Error approving verification:", error);
    }
  };

  const handleRejectVerification = async (restaurantId) => {
    const reason = prompt("Please enter reason for rejection:");
    if (!reason) return;

    try {
      const response = await fetch(`http://localhost:8000/api/admin/reject-verification/${restaurantId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (data.success) {
        alert("❌ Verification rejected.");
        fetchVerificationRequests();
      }
    } catch (error) {
      console.error("Error rejecting verification:", error);
    }
  };

  // ========== RESTAURANTS ==========
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/restaurants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRestaurants(data.restaurants || []);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (restaurantId, isCurrentlySuspended) => {
    const action = isCurrentlySuspended ? "unsuspend" : "suspend";
    const reason = isCurrentlySuspended ? null : prompt("Enter suspension reason:");
    
    if (!isCurrentlySuspended && !reason) return;

    try {
      const response = await fetch(`http://localhost:8000/api/admin/suspend-restaurant/${restaurantId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          suspend: !isCurrentlySuspended,
          reason: reason || ""
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Restaurant ${action}ed.`);
        fetchRestaurants();
      }
    } catch (error) {
      console.error("Error toggling suspension:", error);
    }
  };

  // ========== USERS ==========
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========== LOGOUT ==========
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="admin-panel">
      {/* HEADER */}
      <div className="admin-header">
        <h1>EatEase Admin Panel</h1>
        <div className="admin-info">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="admin-content">
        {loading && <div className="loading-overlay"><p>Loading...</p></div>}

        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === "Dashboard" && (
          <div className="dashboard">
            <h2>Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalRestaurants}</div>
                <div className="stat-label">Total Restaurants</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.pendingVerifications}</div>
                <div className="stat-label">Pending Verifications</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.pendingFeatureRequests}</div>
                <div className="stat-label">Pending Feature Requests</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.featuredRestaurants}/10</div>
                <div className="stat-label">Featured Restaurants</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.suspendedRestaurants}</div>
                <div className="stat-label">Suspended Restaurants</div>
              </div>
            </div>

            {/* Featured Limit Warning */}
            {stats.featuredRestaurants >= 8 && (
              <div className={`limit-warning ${stats.featuredRestaurants >= 10 ? 'danger' : 'warning'}`}>
                {stats.featuredRestaurants >= 10 
                  ? "❌ MAXIMUM REACHED: 10/10 featured restaurants. Remove some before adding new ones."
                  : `⚠️ WARNING: ${stats.featuredRestaurants}/10 featured restaurants. ${10 - stats.featuredRestaurants} spots remaining.`
                }
              </div>
            )}
          </div>
        )}

        {/* ========== FEATURE REQUESTS TAB ========== */}
        {activeTab === "Feature Requests" && (
          <div className="feature-requests-section">
            <div className="section-header">
              <h2>Feature Requests</h2>
              <div className="header-info">
                <span className="featured-count">
                  Featured: <strong>{stats.featuredRestaurants}/10</strong>
                </span>
                <button onClick={fetchFeatureRequests} className="refresh-btn">
                  Refresh
                </button>
              </div>
            </div>

            {featureRequests.length === 0 ? (
              <div className="empty-state">
                <h3>No Pending Requests</h3>
              </div>
            ) : (
              <div className="requests-container">
                <div className="requests-list">
                  {featureRequests.map((request) => (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <h4>{request.restaurant_name}</h4>
                        <div className="request-meta">
                          <span className="owner-info">
                            Owner: <strong>{request.owner_name}</strong> ({request.owner_email})
                          </span>
                          <span className="request-date">
                            Submitted: {formatDate(request.submitted_at)}
                          </span>
                        </div>
                      </div>

                      <div className="request-details">
                        <p><strong>Cuisine:</strong> {request.cuisine}</p>
                        
                        <div className="featured-description-box">
                          <strong>Featured Description:</strong>
                          <p className="description-text">"{request.featured_description}"</p>
                        </div>

                        {/* Show if restaurant is already featured */}
                        {request.restaurant_is_featured && (
                          <div className="already-featured-badge">
                            <span className="badge-icon">✅</span>
                            <span className="badge-text">CURRENTLY FEATURED</span>
                          </div>
                        )}
                      </div>

                      <div className="request-actions">
                        {!request.restaurant_is_featured ? (
                          <>
                            <button 
                              className="approve-btn"
                              onClick={() => handleApproveFeature(request.id, request.restaurant_id)}
                              disabled={stats.featuredRestaurants >= 10}
                              title={stats.featuredRestaurants >= 10 ? "Max 10 featured restaurants reached" : ""}
                            >
                              Approve
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => handleRejectFeature(request.id)}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button 
                            className="remove-featured-btn"
                            onClick={() => handleRemoveFromFeatured(request.restaurant_id)}
                          >
                            Remove From Featured
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Currently Featured Restaurants List */}
            <div className="featured-restaurants-section">
              <h3>Currently Featured Restaurants</h3>
              {restaurants.filter(r => r.is_featured).length === 0 ? (
                <div className="empty-state">
                  <p>No Restaurants Are Featured.</p>
                </div>
              ) : (
                <div className="featured-list">
                  {restaurants
                    .filter(r => r.is_featured)
                    .map(restaurant => (
                      <div key={restaurant.id} className="featured-item">
                        <div className="featured-info">
                          <h4>{restaurant.name}</h4>
                          <p className="featured-description">"{restaurant.featured_description || 'No description'}"</p>
                          <p className="featured-meta">
                            Owner: {restaurant.owner_name} • Added: {formatDate(restaurant.updated_at)}
                          </p>
                        </div>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveFromFeatured(restaurant.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== VERIFICATIONS TAB ========== */}
        {activeTab === "Verifications" && (
          <div className="admin-section">
            <h2>Verification Requests</h2>
            <div className="section-header">
              <p>Restaurants requesting verification</p>
              <button onClick={fetchVerificationRequests} className="refresh-btn">
                Refresh
              </button>
            </div>
            
            {verificationRequests.length === 0 ? (
              <div className="empty-state">
                <p>No pending verification requests</p>
              </div>
            ) : (
              <div className="requests-list">
                {verificationRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <h4>{request.restaurant_name}</h4>
                    <p>Owner: {request.owner_name} ({request.owner_email})</p>
                    <p>Cuisine: {request.cuisine}</p>
                    <div className="verification-reason">
                      <strong>Verification Reason:</strong>
                      <p>{request.verification_request}</p>
                    </div>
                    <div className="request-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveVerification(request.restaurant_id)}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectVerification(request.restaurant_id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== RESTAURANTS TAB ========== */}
        {activeTab === "Restaurants" && (
          <div className="admin-section">
            <h2>Restaurants</h2>
            <div className="section-header">
              <button onClick={fetchRestaurants} className="refresh-btn">
                Refresh
              </button>
            </div>
            
            {restaurants.length === 0 ? (
              <div className="empty-state">
                <p>No restaurants found</p>
              </div>
            ) : (
              <div className="restaurants-list">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="restaurant-card">
                    <h4>{restaurant.name} {restaurant.is_verified && "✅"}</h4>
                    <p>Owner: {restaurant.owner_name}</p>
                    <p>Cuisine: {restaurant.cuisine_type}</p>
                    <p>Status: <span className={`status-${restaurant.crowd_status}`}>{restaurant.crowd_status}</span></p>
                    
                    <div className="restaurant-actions">
                      {restaurant.is_featured && (
                        <span className="featured-badge">🌟 Featured</span>
                      )}
                      <button 
                        className={restaurant.is_suspended ? "unsuspend-btn" : "suspend-btn"}
                        onClick={() => handleToggleSuspend(restaurant.id, restaurant.is_suspended)}
                      >
                        {restaurant.is_suspended ? "Unsuspend" : "Suspend"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== USERS TAB ========== */}
        {activeTab === "Users" && (
          <div className="admin-section">
            <div className="section-header">
              <button onClick={fetchUsers} className="refresh-btn">
                Refresh
              </button>
            </div>
            
            {users.length === 0 ? (
              <div className="empty-state">
                <p>No users found</p>
              </div>
            ) : (
              <div className="users-list">
                {users.map((user) => (
                  <div key={user.id} className="user-card">
                    <h4>{user.name}</h4>
                    <p>Email: {user.email}</p>
                    <p>Type: <span className={`user-type ${user.user_type}`}>{user.user_type}</span></p>
                    <p>Joined: {formatDate(user.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
