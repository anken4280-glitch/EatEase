import React, { useState, useEffect } from 'react';
import "./MenuTab.css";

const MenuTab = ({ restaurantId }) => {
  const [menuDescription, setMenuDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    console.log('MenuTab: Loading menu for restaurant', restaurantId);
    fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      // FIX: Change from /menu to /menu-text
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/menu-text`);
      const data = await response.json();
      console.log('MenuTab API response:', data);
      
      if (data.success) {
        // FIX: Change from data.menu.description to data.menu_description
        setMenuDescription(data.menu_description || '');
        setRestaurantName(data.restaurant_name || '');
        
        if (!data.menu_description) {
          setMenuDescription('This restaurant hasn\'t added a menu yet.');
        }
      } else {
        setMenuDescription('Error loading menu: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenuDescription('Unable to load menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-reviews-tab loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Parse the menu text with formatting
  const renderMenuContent = () => {
    if (!menuDescription || menuDescription.includes('hasn\'t added') || menuDescription.includes('Error') || menuDescription.includes('Unable')) {
      return <p className="empty-menu">{menuDescription}</p>;
    }
    
    const lines = menuDescription.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for headers (ends with colon)
      if (trimmedLine.endsWith(':')) {
        return <h4 key={index} className="menu-header">{trimmedLine}</h4>;
      }
      
      // Check for bullet points
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        return (
          <div key={index} className="menu-item">
            <span className="bullet">•</span>
            <span>{trimmedLine.substring(1).trim()}</span>
          </div>
        );
      }
      
      // Check for price items (contains $)
      else if (trimmedLine.includes('$')) {
        // Try to split by dash for price
        if (trimmedLine.includes(' - ')) {
          const parts = trimmedLine.split(' - ');
          if (parts.length === 2) {
            return (
              <div key={index} className="menu-item-with-price">
                <span className="item-name">{parts[0].trim()}</span>
                <span className="item-price">{parts[1].trim()}</span>
              </div>
            );
          }
        }
        return <p key={index} className="menu-line">{trimmedLine}</p>;
      }
      
      // Regular paragraph
      else if (trimmedLine) {
        return <p key={index} className="menu-line">{trimmedLine}</p>;
      }
      
      // Empty line (preserve spacing)
      return <br key={index} />;
    });
  };

  return (
    <div className="menu-tab">
        <h2>{restaurantName ? `Menu: ` : 'Menu & Pricing'}</h2>
      
      <div className="menu-content">
        {renderMenuContent()}
      </div>
      
      <div className="menu-footer">
        <p><strong>Note:</strong> Menu items and prices are subject to change.</p>
      </div>
    </div>
  );
};

export default MenuTab;