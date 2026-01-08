import React, { useState, useEffect } from "react";
import "./PremiumRecommendations.css";
import RestaurantCard from "../RestaurantCard/RestaurantCard";

const PremiumRecommendations = ({ currentRestaurantId, limit = 5 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSection, setShowSection] = useState(true); // NEW: Control visibility

  useEffect(() => {
    fetchPremiumRecommendations();
  }, [currentRestaurantId, limit]);

  const fetchPremiumRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowSection(true); // Reset visibility
      
      const params = new URLSearchParams({
        limit: limit,
        ...(currentRestaurantId && { exclude_id: currentRestaurantId })
      });
      
      const response = await fetch(
        `http://localhost:8000/api/restaurants/premium/recommendations?${params}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Premium API Response:', data);
      
      if (data.success) {
        if (data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
          setShowSection(true); // Show section
        } else {
          console.log('No premium restaurants available to recommend');
          setShowSection(false); // Hide section completely
          setRecommendations([]);
        }
      } else {
        setError(data.message || 'Failed to load recommendations');
        setShowSection(false); // Hide on error
      }
    } catch (err) {
      console.error("Error fetching premium recommendations:", err);
      setError("Failed to load recommendations");
      setShowSection(false); // Hide on error
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = (restaurant) => {
    console.log("Clicked premium restaurant:", restaurant);
    window.location.href = `/?restaurant=${restaurant.id}`;
  };

  // If section should be hidden, return null
  if (!showSection) {
    return null;
  }

  if (loading) {
    return (
      <div className="premium-recommendations loading">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-recommendations error">
        <h3>Premium Recommendations</h3>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchPremiumRecommendations} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-recommendations">
      <div className="recommendations-header">
        <h3>You Might Like</h3>
      </div>
      
      <div className="recommendations-scroll-container">
        <div className="recommendations-grid">
          {recommendations.map((restaurant) => (
            <div key={restaurant.id} className="recommendation-card-wrapper">
              <RestaurantCard
                restaurant={restaurant}
                onRestaurantClick={handleRestaurantClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumRecommendations;