import React, { useState, useEffect } from 'react';
import './TierBadge.css';

const TierBadge = ({ restaurantId, ownerView = false }) => {
  const [tier, setTier] = useState('basic');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId && ownerView) {
      fetchTier();
    }
  }, [restaurantId, ownerView]);

  const fetchTier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/subscription/tier', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTier(data.tier);
      }
    } catch (error) {
      console.error('Error fetching tier:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="tier-badge loading">...</span>;
  }

  if (tier === 'premium') {
    return <span className="tier-badge premium">⭐ Premium</span>;
  }

  return <span className="tier-badge basic">Free</span>;
};

export default TierBadge;