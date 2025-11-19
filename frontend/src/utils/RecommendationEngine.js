// src/utils/RecommendationEngine.js

export class RecommendationEngine {
  static calculateMatchScore(restaurant, preferences, currentTime) {
    let score = 0;
    const maxScore = 100;

    // 1. Cuisine Match (25 points)
    if (preferences.cuisine.length > 0) {
      if (preferences.cuisine.includes(restaurant.cuisine)) {
        score += 25;
      } else {
        score -= 10; // Penalty for non-preferred cuisine
      }
    }

    // 2. Crowd Tolerance Match (20 points)
    const crowdScore = this.calculateCrowdMatch(restaurant, preferences.crowdTolerance);
    score += crowdScore;

    // 3. Wait Time Match (20 points)
    const waitTimeScore = this.calculateWaitTimeMatch(restaurant.waitTime, preferences.maxWaitTime);
    score += waitTimeScore;

    // 4. Popular Times Analysis (15 points)
    const timeScore = this.calculateTimeMatch(restaurant, currentTime);
    score += timeScore;

    // 5. Promotion Bonus (10 points)
    if (restaurant.hasPromo) {
      score += 10;
    }

    // 6. Rating Bonus (10 points)
    if (restaurant.rating >= 4.0) {
      score += 10;
    } else if (restaurant.rating >= 3.0) {
      score += 5;
    }

    // Ensure score is between 0-100
    return Math.max(0, Math.min(maxScore, score));
  }

  static calculateCrowdMatch(restaurant, crowdTolerance) {
    const crowdLevels = { "low": 1, "moderate": 2, "high": 3 };
    const toleranceLevels = { "low": 1, "medium": 2, "high": 3 };
    
    const restaurantLevel = crowdLevels[restaurant.crowdLevel.toLowerCase()] || 2;
    const userTolerance = toleranceLevels[crowdTolerance] || 2;
    
    const difference = Math.abs(restaurantLevel - userTolerance);
    
    if (difference === 0) return 20; // Perfect match
    if (difference === 1) return 10; // Acceptable
    return 0; // Poor match
  }

  static calculateWaitTimeMatch(waitTime, maxWaitTime) {
    if (waitTime <= maxWaitTime * 0.5) return 20; // Much better than expected
    if (waitTime <= maxWaitTime) return 15; // Within tolerance
    if (waitTime <= maxWaitTime * 1.5) return 5; // Slightly over
    return 0; // Too long
  }

  static calculateTimeMatch(restaurant, currentTime) {
    // Simulate popular times analysis based on current hour
    const hour = currentTime.getHours();
    const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 20);
    
    if (restaurant.crowdLevel === "low" && isPeakHour) {
      return 15; // Great find during peak hours!
    }
    if (restaurant.crowdLevel === "moderate" && !isPeakHour) {
      return 10; // Good balance
    }
    return 5; // Average
  }

  static getRecommendationReason(restaurant, preferences, score) {
    const reasons = [];
    
    // Cuisine reason
    if (preferences.cuisine.includes(restaurant.cuisine)) {
      reasons.push(`Matches your preferred ${restaurant.cuisine} cuisine`);
    }
    
    // Crowd reason
    if (restaurant.crowdLevel === "low" && preferences.crowdTolerance === "low") {
      reasons.push("Perfect quiet atmosphere for your preference");
    } else if (restaurant.crowdLevel === "moderate" && preferences.crowdTolerance === "medium") {
      reasons.push("Comfortable crowd level matching your preference");
    }
    
    // Wait time reason
    if (restaurant.waitTime <= preferences.maxWaitTime * 0.5) {
      reasons.push(`Short wait time (${restaurant.waitTime}min) - much better than your ${preferences.maxWaitTime}min limit`);
    } else if (restaurant.waitTime <= preferences.maxWaitTime) {
      reasons.push(`Wait time within your ${preferences.maxWaitTime}min limit`);
    }
    
    // Promotion reason
    if (restaurant.hasPromo) {
      reasons.push("Currently has special promotions");
    }
    
    // Rating reason
    if (restaurant.rating >= 4.0) {
      reasons.push("Highly rated by other diners");
    }
    
    return reasons.length > 0 ? reasons : ["Good overall match based on current conditions"];
  }
}