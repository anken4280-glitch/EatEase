import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer 
} from 'recharts';
import { 
} from "../../api";
import './DeveloperAdmin.css';

export default function DeveloperAdmin() {
  const [restaurants, setRestaurants] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modern metrics state
  const [systemMetrics, setSystemMetrics] = useState({
    activeUsers: 1247,
    totalRestaurants: 89,
    apiCalls: 24567,
    errorRate: 0.23,
    responseTime: 142,
    storageUsed: 67
  });

  const [performanceData, setPerformanceData] = useState([
    { name: 'Mon', users: 400, revenue: 2400, errors: 12 },
    { name: 'Tue', users: 600, revenue: 3800, errors: 8 },
    { name: 'Wed', users: 800, revenue: 4200, errors: 5 },
    { name: 'Thu', users: 1200, revenue: 5200, errors: 3 },
    { name: 'Fri', users: 900, revenue: 4800, errors: 7 },
    { name: 'Sat', users: 1500, revenue: 6100, errors: 15 },
    { name: 'Sun', users: 1800, revenue: 7200, errors: 10 }
  ]);

  const [userDistribution, setUserDistribution] = useState([
    { name: 'Diners', value: 75 },
    { name: 'Restaurant Admins', value: 20 },
    { name: 'Developers', value: 5 }
  ]);

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, action: 'User Registration', user: 'john_doe', time: '2 min ago', status: 'success' },
    { id: 2, action: 'API Update', user: 'system', time: '5 min ago', status: 'warning' },
    { id: 3, action: 'Database Backup', user: 'admin', time: '10 min ago', status: 'success' },
    { id: 4, action: 'Error Report', user: 'auto_monitor', time: '15 min ago', status: 'error' },
    { id: 5, action: 'Feature Deploy', user: 'dev_team', time: '20 min ago', status: 'success' }
  ]);

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    apiRateLimit: 1000,
    autoBackup: true,
    debugMode: false,
    notificationEnabled: true
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  // Modern Component: Metric Card
  const MetricCard = ({ title, value, change, icon, color }) => (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="metric-info">
          <h3>{value}</h3>
          <span className="metric-title">{title}</span>
          {change && (
            <span className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Modern Component: Status Badge
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      success: { color: '#10B981', label: 'Success' },
      warning: { color: '#F59E0B', label: 'Warning' },
      error: { color: '#EF4444', label: 'Error' },
      info: { color: '#3B82F6', label: 'Info' }
    };
    
    const config = statusConfig[status] || statusConfig.info;
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`
        }}
      >
        {config.label}
      </span>
    );
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
      {/* Modern Header */}
      <div className="admin-header">
        <div className="header-content">
          <h1>🚀 Developer Admin</h1>
          <p>Complete system oversight and management</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            📊 Export Reports
          </button>
          <button className="btn btn-primary">
            ⚙️ System Settings
          </button>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="admin-tabs">
        {['dashboard', 'restaurants', 'reports', 'analytics', 'system'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'restaurants' && '🏪 Restaurants'}
            {tab === 'reports' && `⚠️ Reports (${reports.length})`}
            {tab === 'analytics' && '📈 Analytics'}
            {tab === 'system' && '⚙️ System'}
          </button>
        ))}
      </div>

      {/* Modern Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="tab-content">
          {/* Metrics Grid */}
          <div className="metrics-grid">
            <MetricCard
              title="Total Restaurants"
              value={stats.totalRestaurants.toString()}
              change={5.2}
              icon="🏪"
              color="#10B981"
            />
            <MetricCard
              title="Verified Restaurants"
              value={stats.verified.toString()}
              change={12.5}
              icon="✅"
              color="#3B82F6"
            />
            <MetricCard
              title="Pending Verification"
              value={stats.unverified.toString()}
              change={-2.1}
              icon="⏳"
              color="#F59E0B"
            />
            <MetricCard
              title="Active Reports"
              value={stats.pendingReports.toString()}
              change={8.7}
              icon="⚠️"
              color="#EF4444"
            />
            <MetricCard
              title="Avg. Response Time"
              value="142ms"
              change={-15.3}
              icon="⚡"
              color="#8B5CF6"
            />
            <MetricCard
              title="System Health"
              value="98%"
              change={0.5}
              icon="💚"
              color="#06B6D4"
            />
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            <div className="chart-card">
              <h3>Restaurant Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Verification Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Verified', value: stats.verified },
                      { name: 'Pending', value: stats.unverified }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="activities-card">
            <h3>Recent Activities</h3>
            <div className="activities-list">
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-main">
                    <span className="activity-action">{activity.action}</span>
                    <span className="activity-user">by {activity.user}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">{activity.time}</span>
                    <StatusBadge status={activity.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Restaurants Tab (Your existing code) */}
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

      {/* Reports Tab (Your existing code) */}
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

      {/* Modern Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="tab-content">
          <div className="analytics-header">
            <h2>📈 Advanced Analytics</h2>
            <div className="date-filter">
              <select className="filter-select">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom range</option>
              </select>
            </div>
          </div>
          
          <div className="chart-card full-width">
            <h3>Restaurant Performance Metrics</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#3B82F6" />
                <Bar dataKey="revenue" fill="#10B981" />
                <Bar dataKey="errors" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Your existing analytics content */}
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

      {/* Modern System Tab */}
      {activeTab === 'system' && (
        <div className="tab-content">
          <h2>⚙️ System Configuration</h2>
          <div className="settings-grid">
            {Object.entries(systemSettings).map(([key, value]) => (
              <div key={key} className="setting-item">
                <div className="setting-info">
                  <h4>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                  <p>Configure {key} settings</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => setSystemSettings(prev => ({
                      ...prev,
                      [key]: !value
                    }))}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
          
          <div className="danger-zone">
            <h3>🚨 Danger Zone</h3>
            <div className="danger-actions">
              <button className="btn btn-danger">
                🗑️ Clear All Data
              </button>
              <button className="btn btn-warning">
                🔄 System Reset
              </button>
              <button className="btn btn-danger">
                ⚡ Emergency Shutdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your existing modals */}
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