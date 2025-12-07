import React, { useState, useEffect } from 'react';

const OwnerMenuTab = ({ restaurantId }) => {
  const [menuDescription, setMenuDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing menu
  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/menu-text`);
      const data = await response.json();
      
      if (data.success && data.menu) {
        setMenuDescription(data.menu_description || '');
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const saveMenu = async () => {
    setIsSaving(true);
    setMessage('');
    
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/menu-text`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ menu_description: menuDescription })
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage('✅ Menu saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to save menu');
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      setMessage('❌ Error saving menu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="owner-menu-tab">
      <div className="menu-editor-header">
        <h3>Edit Your Restaurant Menu</h3>
        <p>Describe your menu items, prices, specials, etc.</p>
      </div>
      
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      <div className="menu-editor">
        <textarea
          value={menuDescription}
          onChange={(e) => setMenuDescription(e.target.value)}
          placeholder="Enter your menu description here. Example:

🍔 Main Courses:
• Classic Burger - $12.99
• Chicken Parmesan - $15.99
• Veggie Pizza - $14.99

🥗 Salads:
• Caesar Salad - $9.99
• Greek Salad - $10.99

🍹 Drinks:
• Fresh Lemonade - $3.99
• Iced Tea - $2.99

Daily Specials:
- Monday: 20% off all pizzas
- Tuesday: Buy one burger, get one free"
          rows="20"
          className="menu-textarea"
        />
        
        <div className="editor-actions">
          <button 
            onClick={saveMenu} 
            disabled={isSaving}
            className="save-btn"
          >
            {isSaving ? 'Saving...' : 'Save Menu'}
          </button>
          <button 
            onClick={() => setMenuDescription('')}
            className="clear-btn"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerMenuTab;