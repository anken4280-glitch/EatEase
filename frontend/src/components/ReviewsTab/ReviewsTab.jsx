import React, { useState, useEffect } from 'react';
import '../RestaurantDetails/RestaurantDetails.css';

const ReviewsTab = ({ restaurantId, restaurantName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/reviews`);
      const data = await response.json();
      setReviews(data.data || data);
      setLoading(false);
      
      // Get stats
      const statsResponse = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/stats`);
      const statsData = await statsResponse.json();
      setAverageRating(statsData.average_rating);
      setTotalReviews(statsData.total_reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="reviews-tab loading">
        <div className="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="reviews-tab">
      {/* Rating Summary */}
      <div className="rating-summary-card">
        <div className="rating-overview">
          <div className="average-rating-large">
            <span className="rating-number">{averageRating || '0.0'}</span>
            <span className="rating-max">/5</span>
          </div>
          <div className="rating-stars-large">
            {renderStars(Math.round(averageRating))}
          </div>
          <p className="total-reviews">{totalReviews} reviews</p>
        </div>
        
        {!userReview && (
          <button className="add-review-btn">
            ✍️ Add Your Review
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        <h3 className="reviews-title">Recent Reviews</h3>
        
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <div className="no-reviews-icon">📝</div>
            <h4>No reviews yet</h4>
            <p>Be the first to review {restaurantName}!</p>
            <button className="first-review-btn">
              Write First Review
            </button>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-avatar">
                    {review.user?.name?.charAt(0) || 'U'}
                  </span>
                  <div className="reviewer-details">
                    <span className="reviewer-name">
                      {review.user?.name || 'Anonymous'}
                    </span>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
              
              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  {review.images.slice(0, 3).map((image, index) => (
                    <div key={index} className="review-image">
                      <img src={image} alt={`Review ${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsTab;