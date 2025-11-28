import React, { useState, useEffect } from "react";
import { fetchRestaurants } from "../../api";
import './SimilarRestaurants.css';

export default function SimilarRestaurants({ currentRestaurant, onRestaurantSelect }) {
  const [similarRestaurants, setSimilarRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findSimilarRestaurants();
  }, [currentRestaurant]);

  const findSimilarRestaurants = async () => {
    try {
      const allRestaurants = await fetchRestaurants();
      
      // Calculate similarity scores
      const restaurantsWithScores = allRestaurants
        .filter(restaurant => restaurant.id !== currentRestaurant.id)
        .map(restaurant => ({
          ...restaurant,
          similarityScore: calculateSimilarityScore(currentRestaurant, restaurant)
        }))
        .filter(restaurant => restaurant.similarityScore > 0.3) // Only show reasonably similar ones
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 6); // Top 6 similar restaurants

      setSimilarRestaurants(restaurantsWithScores);
    } catch (error) {
      console.error("Error finding similar restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSimilarityScore = (restaurant1, restaurant2) => {
    let score = 0;
    let maxScore = 0;

    // 1. Cuisine similarity (40% weight)
    if (restaurant1.cuisine === restaurant2.cuisine) {
      score += 40;
    }
    maxScore += 40;

    // 2. Price range similarity (20% weight)
    const priceSimilar = Math.abs((restaurant1.priceLevel || 2) - (restaurant2.priceLevel || 2)) <= 1;
    if (priceSimilar) {
      score += 20;
    }
    maxScore += 20;

    // 3. Crowd level compatibility (15% weight)
    const crowdLevels = { "low": 1, "moderate": 2, "high": 3 };
    const crowdDiff = Math.abs(
      (crowdLevels[restaurant1.crowdLevel?.toLowerCase()] || 2) - 
      (crowdLevels[restaurant2.crowdLevel?.toLowerCase()] || 2)
    );
    if (crowdDiff <= 1) {
      score += 15;
    }
    maxScore += 15;

    // 4. Rating similarity (15% weight)
    const ratingDiff = Math.abs((restaurant1.rating || 3) - (restaurant2.rating || 3));
    if (ratingDiff <= 1) {
      score += 15;
    }
    maxScore += 15;

    // 5. Promotion status (10% weight)
    if (restaurant1.hasPromo === restaurant2.hasPromo) {
      score += 10;
    }
    maxScore += 10;

    return (score / maxScore) * 100;
  };

  const getSimilarityBadge = (score) => {
    if (score >= 80) return { text: "Very Similar", color: "var(--success)" };
    if (score >= 60) return { text: "Similar", color: "var(--warning)" };
    return { text: "Somewhat Similar", color: "var(--text-light)" };
  };

  const getColor = (status) => {
    if (status === "green") return "🟢";
    if (status === "yellow") return "🟡";
    if (status === "red") return "🔴";
    return "⚪";
  };

  if (loading) {
    return (
      <div className="similar-restaurants">
        <h4>🍽️ Finding Similar Restaurants...</h4>
        <div className="loading">Searching for great alternatives...</div>
      </div>
    );
  }

  if (similarRestaurants.length === 0) {
    return (
      <div className="similar-restaurants">
        <h4>🍽️ Similar Restaurants</h4>
        <div className="no-similar">
          <p>No similar restaurants found. This one is quite unique! 🦄</p>
        </div>
      </div>
    );
  }

  return (
    <div className="similar-restaurants">
      <div className="similar-header">
        <h4>🍽️ You Might Also Like</h4>
        <p className="similar-subtitle">Restaurants similar to {currentRestaurant.name}</p>
      </div>

      <div className="similar-cards">
        {similarRestaurants.map(restaurant => {
          const similarity = getSimilarityBadge(restaurant.similarityScore);
          
          return (
            <div 
              key={restaurant.id} 
              className="similar-card"
              onClick={() => onRestaurantSelect && onRestaurantSelect(restaurant)}
            >
              <div className="similarity-badge" style={{ backgroundColor: similarity.color }}>
                {Math.round(restaurant.similarityScore)}% Match
              </div>
              
              <div className="similar-card-content">
                <h5>{restaurant.name}</h5>
                <p className="similar-cuisine">{restaurant.cuisine}</p>
                
                <div className="similar-details">
                  <div className="detail-item">
                    <span className="status-indicator">
                      {getColor(restaurant.status)} {restaurant.crowdLevel}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="wait-time">⏱️ {restaurant.waitTime}min</span>
                  </div>
                  <div className="detail-item">
                    <span className="rating">⭐ {restaurant.rating || "N/A"}/5</span>
                  </div>
                </div>

                {restaurant.hasPromo && (
                  <div className="promo-indicator">🔥 Promotions Available</div>
                )}

                <div className="similarity-reasons">
                  <small>
                    {getSimilarityReasons(currentRestaurant, restaurant)}
                  </small>
                </div>
              </div>

              <button className="view-restaurant-btn">
                View Details →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const getSimilarityReasons = (current, similar) => {
  const reasons = [];
  
  if (current.cuisine === similar.cuisine) {
    reasons.push("Same cuisine");
  }
  
  if (current.crowdLevel === similar.crowdLevel) {
    reasons.push("Similar crowd level");
  }
  
  if (Math.abs((current.rating || 3) - (similar.rating || 3)) <= 0.5) {
    reasons.push("Similar ratings");
  }
  
  if (current.hasPromo && similar.hasPromo) {
    reasons.push("Both have promotions");
  }
  
  return reasons.length > 0 ? reasons.join(" • ") : "Good alternative option";
};