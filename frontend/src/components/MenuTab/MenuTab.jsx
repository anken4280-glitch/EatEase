import React, { useState, useEffect } from 'react';
import '../RestaurantDetails/RestaurantDetails.css';

const MenuTab = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
  try {
    const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/menu`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle both array and object responses
    if (Array.isArray(data)) {
      setMenuItems(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    } else if (data.error) {
      // API returned an error object
      console.error('API Error:', data.error);
      setMenuItems([]);
    }
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    setMenuItems([]);
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="menu-tab loading">
        <div className="loading-spinner"></div>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="menu-tab empty">
        <div className="empty-icon">🍽️</div>
        <h3>Menu Coming Soon</h3>
        <p>This restaurant hasn't added their menu yet.</p>
      </div>
    );
  }

  return (
    <div className="menu-tab">
      <div className="menu-header">
        <h3 className="menu-title">📋 Menu</h3>
        <span className="menu-count">{menuItems.length} items</span>
      </div>

      {categories.map(category => {
        const categoryItems = menuItems.filter(item => item.category === category);
        
        return (
          <div key={category} className="menu-category">
            <h4 className="category-title">{category || 'Uncategorized'}</h4>
            <div className="menu-items-list">
              {categoryItems.map(item => (
                <div key={item.id} className="menu-item-card">
                  <div className="menu-item-info">
                    <div className="menu-item-header">
                      <span className="item-name">{item.name}</span>
                      {item.is_available ? (
                        <span className="item-price">₱{item.price}</span>
                      ) : (
                        <span className="item-unavailable">Unavailable</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="item-description">{item.description}</p>
                    )}
                  </div>
                  {item.image_url && (
                    <div className="menu-item-image">
                      <img src={item.image_url} alt={item.name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuTab;