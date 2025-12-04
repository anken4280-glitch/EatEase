import React, { useState, useEffect } from 'react';

const OwnerMenuTab = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/menu`);
      const data = await response.json();
      setMenuItems(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
      setLoading(false);
    }
  };

  return (
    <div className="owner-menu-tab">
      <div className="tab-header">
        <h3>Your Menu</h3>
        <button 
          className="add-item-btn"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Add Menu Item
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading menu...</div>
      ) : menuItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h4>No Menu Items Yet</h4>
          <button 
            className="add-first-btn"
            onClick={() => setShowAddModal(true)}
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="menu-items-list">
          {menuItems.map(item => (
            <div key={item.id} className="menu-item-card">
              <div className="item-info">
                <div className="item-header">
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">₱{item.price}</span>
                </div>
                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}
                <div className="item-meta">
                  <span className="item-category">{item.category}</span>
                  <span className={`item-availability ${item.is_available ? 'available' : 'unavailable'}`}>
                    {item.is_available ? '✅ Available' : '❌ Unavailable'}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button 
                  className="edit-item-btn"
                  onClick={() => setEditItem(item)}
                >
                  ✏️ Edit
                </button>
                <button className="delete-item-btn">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerMenuTab;