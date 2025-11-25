import React, { useState, useEffect } from "react";
import { 
  fetchRestaurants, 
  verifyRestaurant, 
  deleteRestaurant, 
  fetchReports, 
  resolveReport,
  createRestaurant,
  updateRestaurant,
  addMockReport
} from "../api";

export default function DeveloperAdmin() {
  const [restaurants, setRestaurants] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("restaurants");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    cuisine: "",
    address: "",
    phone: "",
    location: "",
    verified: false
  });

  const [reportForm, setReportForm] = useState({
    type: "Inaccurate Information",
    description: "",
    restaurantId: "",
    userName: "Test User"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [restaurantsData, reportsData] = await Promise.all([
      fetchRestaurants(),
      fetchReports()
    ]);
    setRestaurants(restaurantsData);
    setReports(reportsData);
    setLoading(false);
    
    if (restaurantsData.length > 0) {
      setSelectedRestaurant(restaurantsData[0]);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || 
                         (filter === "verified" && restaurant.verified) ||
                         (filter === "unverified" && !restaurant.verified);
    return matchesSearch && matchesFilter;
  });

  const handleVerifyRestaurant = async (id, verified) => {
    const result = await verifyRestaurant(id, verified);
    if (result.success) {
      alert(`✅ ${result.message}`);
      setRestaurants(prev => prev.map(r => 
        r.id === id ? result.restaurant : r
      ));
      if (selectedRestaurant?.id === id) {
        setSelectedRestaurant(result.restaurant);
      }
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this restaurant?")) {
      const result = await deleteRestaurant(id);
      if (result.success) {
        alert(`✅ ${result.message}`);
        setRestaurants(prev => prev.filter(r => r.id !== id));
        if (selectedRestaurant?.id === id) {
          setSelectedRestaurant(filteredRestaurants[0] || null);
        }
      }
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    const result = await createRestaurant(restaurantForm);
    if (result.success) {
      alert("✅ Restaurant created successfully!");
      setRestaurants(prev => [...prev, result.restaurant]);
      setShowRestaurantForm(false);
      setRestaurantForm({
        name: "", cuisine: "", address: "", phone: "", location: "", verified: false
      });
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    
    const result = await updateRestaurant(selectedRestaurant.id, restaurantForm);
    if (result.success) {
      alert("✅ Restaurant updated successfully!");
      setRestaurants(prev => prev.map(r => 
        r.id === selectedRestaurant.id ? result.restaurant : r
      ));
      setSelectedRestaurant(result.restaurant);
      setShowRestaurantForm(false);
    }
  };

  const handleResolveReport = async (reportId) => {
    const result = await resolveReport(reportId);
    if (result.success) {
      alert("✅ Report resolved!");
      setReports(prev => prev.filter(r => r.id !== reportId));
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    const result = await addMockReport({
      ...reportForm,
      restaurantId: parseInt(reportForm.restaurantId),
      restaurantName: restaurants.find(r => r.id === parseInt(reportForm.restaurantId))?.name || "Unknown"
    });
    
    if (result.success) {
      alert("✅ Test report created!");
      setReports(prev => [...prev, result.report]);
      setShowReportForm(false);
      setReportForm({
        type: "Inaccurate Information",
        description: "",
        restaurantId: "",
        userName: "Test User"
      });
    }
  };

  const stats = {
    totalRestaurants: restaurants.length,
    verified: restaurants.filter(r => r.verified).length,
    unverified: restaurants.filter(r => !r.verified).length,
    pendingReports: reports.length
  };

  if (loading) {
    return (
      <div className="developer-admin">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading Developer Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="developer-admin">
      <div className="admin-header">
        <h1>🚀 Developer Admin Panel</h1>
        <p>Platform Management & Restaurant Verification</p>
        
        <div className="admin-stats">
          <div className="stat-card">
            <h3>{stats.totalRestaurants}</h3>
            <p>Total Restaurants</p>
          </div>
          <div className="stat-card">
            <h3>{stats.verified}</h3>
            <p>Verified</p>
          </div>
          <div className="stat-card">
            <h3>{stats.unverified}</h3>
            <p>Pending Verification</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pendingReports}</h3>
            <p>Pending Reports</p>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === "restaurants" ? "active" : ""}
          onClick={() => setActiveTab("restaurants")}
        >
          🏪 Restaurant Management
        </button>
        <button 
          className={activeTab === "reports" ? "active" : ""}
          onClick={() => setActiveTab("reports")}
        >
          ⚠️ Report Center ({reports.length})
        </button>
        <button 
          className={activeTab === "analytics" ? "active" : ""}
          onClick={() => setActiveTab("analytics")}
        >
          📊 Platform Analytics
        </button>
      </div>

      {activeTab === "restaurants" && (
        <div className="restaurant-management">
          <div className="management-header">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Restaurants</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
              <button 
                className="btn-primary"
                onClick={() => {
                  setSelectedRestaurant(null);
                  setRestaurantForm({
                    name: "", cuisine: "", address: "", phone: "", location: "", verified: false
                  });
                  setShowRestaurantForm(true);
                }}
              >
                + Add New Restaurant
              </button>
            </div>
          </div>

          <div className="restaurant-layout">
            <div className="restaurant-list">
              <h3>Restaurants ({filteredRestaurants.length})</h3>
              {filteredRestaurants.map(restaurant => (
                <div 
                  key={restaurant.id}
                  className={`restaurant-item ${selectedRestaurant?.id === restaurant.id ? 'selected' : ''} ${!restaurant.verified ? 'unverified' : ''}`}
                  onClick={() => setSelectedRestaurant(restaurant)}
                >
                  <div className="restaurant-info">
                    <h4>{restaurant.name}</h4>
                    <p>{restaurant.cuisine} • {restaurant.location}</p>
                    <div className="restaurant-meta">
                      <span className={`verification-status ${restaurant.verified ? 'verified' : 'pending'}`}>
                        {restaurant.verified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                      <span className={`status-${restaurant.status}`}>
                        {restaurant.status} • {restaurant.occupancy}%
                      </span>
                    </div>
                  </div>
                  <div className="restaurant-actions">
                    <button 
                      className={restaurant.verified ? "btn-warning" : "btn-success"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerifyRestaurant(restaurant.id, !restaurant.verified);
                      }}
                    >
                      {restaurant.verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRestaurant(restaurant.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="restaurant-details">
              {selectedRestaurant ? (
                <>
                  <div className="details-header">
                    <h3>{selectedRestaurant.name}</h3>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setRestaurantForm({
                          name: selectedRestaurant.name,
                          cuisine: selectedRestaurant.cuisine,
                          address: selectedRestaurant.address,
                          phone: selectedRestaurant.phone,
                          location: selectedRestaurant.location,
                          verified: selectedRestaurant.verified
                        });
                        setShowRestaurantForm(true);
                      }}
                    >
                      ✏️ Edit Restaurant
                    </button>
                  </div>

                  <div className="restaurant-info-grid">
                    <div className="info-item">
                      <label>Cuisine:</label>
                      <span>{selectedRestaurant.cuisine}</span>
                    </div>
                    <div className="info-item">
                      <label>Location:</label>
                      <span>{selectedRestaurant.location}</span>
                    </div>
                    <div className="info-item">
                      <label>Address:</label>
                      <span>{selectedRestaurant.address}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone:</label>
                      <span>{selectedRestaurant.phone}</span>
                    </div>
                    <div className="info-item">
                      <label>Verification:</label>
                      <span className={selectedRestaurant.verified ? 'verified' : 'pending'}>
                        {selectedRestaurant.verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Current Status:</label>
                      <span className={`status-${selectedRestaurant.status}`}>
                        {selectedRestaurant.status} ({selectedRestaurant.crowdLevel})
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Occupancy:</label>
                      <span>{selectedRestaurant.occupancy}%</span>
                    </div>
                    <div className="info-item">
                      <label>Wait Time:</label>
                      <span>{selectedRestaurant.waitTime} min</span>
                    </div>
                    <div className="info-item">
                      <label>Rating:</label>
                      <span>⭐ {selectedRestaurant.rating}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <p>Select a restaurant to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="reports-management">
          <div className="reports-header">
            <h3>User Reports Management</h3>
            <button 
              className="btn-primary"
              onClick={() => setShowReportForm(true)}
            >
              + Add Test Report
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="no-reports">
              <p>No pending reports 🎉</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map(report => (
                <div key={report.id} className="report-item">
                  <div className="report-content">
                    <div className="report-header">
                      <h4>{report.type}</h4>
                      <span className="report-date">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p>{report.description}</p>
                    <div className="report-meta">
                      <span><strong>Restaurant:</strong> {report.restaurantName}</span>
                      <span><strong>Reported by:</strong> {report.userName}</span>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button 
                      className="btn-success"
                      onClick={() => handleResolveReport(report.id)}
                    >
                      ✅ Resolve
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        const restaurant = restaurants.find(r => r.id === report.restaurantId);
                        if (restaurant) {
                          setSelectedRestaurant(restaurant);
                          setActiveTab("restaurants");
                        }
                      }}
                    >
                      🔍 View Restaurant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="analytics-tab">
          <h3>Platform Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Verification Status</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${(stats.verified / stats.totalRestaurants) * 100}%`}}
                ></div>
              </div>
              <p>{stats.verified} of {stats.totalRestaurants} restaurants verified</p>
              <p className="percentage">{Math.round((stats.verified / stats.totalRestaurants) * 100)}% verified</p>
            </div>

            <div className="analytics-card">
              <h4>Crowd Status Distribution</h4>
              <div className="status-distribution">
                <div className="status-item">
                  <span className="status-dot green"></span>
                  Low: {restaurants.filter(r => r.status === 'green').length}
                </div>
                <div className="status-item">
                  <span className="status-dot yellow"></span>
                  Moderate: {restaurants.filter(r => r.status === 'yellow').length}
                </div>
                <div className="status-item">
                  <span className="status-dot red"></span>
                  High: {restaurants.filter(r => r.status === 'red').length}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h4>Cuisine Distribution</h4>
              <div className="cuisine-stats">
                {[...new Set(restaurants.map(r => r.cuisine))].map(cuisine => (
                  <div key={cuisine} className="cuisine-item">
                    <span>{cuisine}</span>
                    <span>{restaurants.filter(r => r.cuisine === cuisine).length}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card">
              <h4>Platform Health</h4>
              <div className="health-stats">
                <div className="health-item">
                  <span>Active Restaurants:</span>
                  <span>{stats.totalRestaurants}</span>
                </div>
                <div className="health-item">
                  <span>Verification Rate:</span>
                  <span>{Math.round((stats.verified / stats.totalRestaurants) * 100)}%</span>
                </div>
                <div className="health-item">
                  <span>Pending Reports:</span>
                  <span>{stats.pendingReports}</span>
                </div>
                <div className="health-item">
                  <span>Avg. Rating:</span>
                  <span>⭐ {(restaurants.reduce((acc, r) => acc + r.rating, 0) / restaurants.length).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRestaurantForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{selectedRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
            <form onSubmit={selectedRestaurant ? handleUpdateRestaurant : handleCreateRestaurant}>
              <div className="form-grid">
                <label>
                  Restaurant Name:
                  <input
                    type="text"
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({...restaurantForm, name: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Cuisine Type:
                  <input
                    type="text"
                    value={restaurantForm.cuisine}
                    onChange={(e) => setRestaurantForm({...restaurantForm, cuisine: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Address:
                  <input
                    type="text"
                    value={restaurantForm.address}
                    onChange={(e) => setRestaurantForm({...restaurantForm, address: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Phone:
                  <input
                    type="text"
                    value={restaurantForm.phone}
                    onChange={(e) => setRestaurantForm({...restaurantForm, phone: e.target.value})}
                    required
                  />
                </label>
                <label>
                  Location Area:
                  <input
                    type="text"
                    value={restaurantForm.location}
                    onChange={(e) => setRestaurantForm({...restaurantForm, location: e.target.value})}
                    required
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={restaurantForm.verified}
                    onChange={(e) => setRestaurantForm({...restaurantForm, verified: e.target.checked})}
                  />
                  Verified Restaurant
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {selectedRestaurant ? 'Update Restaurant' : 'Create Restaurant'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowRestaurantForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create Test Report</h3>
            <form onSubmit={handleCreateReport}>
              <label>
                Report Type:
                <select
                  value={reportForm.type}
                  onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                >
                  <option value="Inaccurate Information">Inaccurate Information</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Spam">Spam</option>
                  <option value="Fake Reviews">Fake Reviews</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>
                Restaurant:
                <select
                  value={reportForm.restaurantId}
                  onChange={(e) => setReportForm({...reportForm, restaurantId: e.target.value})}
                  required
                >
                  <option value="">Select a restaurant</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Description:
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                  required
                  placeholder="Describe the issue..."
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Create Test Report
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowReportForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}