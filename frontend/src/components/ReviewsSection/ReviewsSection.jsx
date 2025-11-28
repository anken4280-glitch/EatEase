import React, { useState, useEffect } from "react";
import './ReviewsSection.css';

export default function ReviewsSection({ restaurantId, currentUser, compact = false }) {
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    visitType: "dine-in"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/restaurants/${restaurantId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to submit a review");
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/restaurants/${restaurantId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment,
          visitType: newReview.visitType,
          userId: currentUser.id
        })
      });

      if (response.ok) {
        const savedReview = await response.json();
        setReviews(prev => [savedReview, ...prev]);
        setNewReview({ rating: 5, comment: "", visitType: "dine-in" });
        setShowReviewForm(false);
        alert("Review submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review. Please try again.");
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const renderStars = (rating, maxStars = 5) => {
    return Array.from({ length: maxStars }, (_, index) => (
      <span
        key={index}
        className={index < rating ? "star filled" : "star"}
      >
        {index < rating ? "⭐" : "☆"}
      </span>
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading reviews...</div>;
  }

  const averageRating = calculateAverageRating();
  const ratingDistribution = getRatingDistribution();

  // Compact mode - show only rating summary and recent review
  if (compact) {
    return (
      <div className="reviews-compact">
        <div className="rating-summary-compact">
          <span className="average-rating">{averageRating || "No ratings"}</span>
          <div className="stars-compact">
            {renderStars(Math.round(averageRating))}
          </div>
          <span className="review-count">({reviews.length} reviews)</span>
        </div>
        
        {reviews.length > 0 && (
          <div className="recent-review">
            <p className="review-excerpt">"{reviews[0].comment.substring(0, 100)}..."</p>
            <span className="reviewer">- {reviews[0].user?.name || "Anonymous"}</span>
          </div>
        )}

        <button 
          onClick={() => setShowReviewForm(true)}
          className="add-review-btn compact"
          disabled={!currentUser}
        >
          ✍️ Write Review
        </button>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="modal-overlay">
            <div className="modal-content review-form-modal">
              <div className="modal-header">
                <h3>Write a Review</h3>
                <button onClick={() => setShowReviewForm(false)} className="close-btn">×</button>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Rating</label>
                  <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${newReview.rating >= star ? 'active' : ''}`}
                        onClick={() => setNewReview({...newReview, rating: star})}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="rating-text">
                      {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Visit Type</label>
                  <select
                    value={newReview.visitType}
                    onChange={(e) => setNewReview({...newReview, visitType: e.target.value})}
                  >
                    <option value="dine-in">🍽️ Dine-in</option>
                    <option value="takeout">🥡 Takeout</option>
                    <option value="delivery">🚚 Delivery</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Your Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    placeholder="Share your experience... What did you like? What could be improved?"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-buttons">
                  <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode - show complete reviews section
  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h4>💬 Customer Reviews</h4>
        <button 
          onClick={() => setShowReviewForm(true)}
          className="add-review-btn"
          disabled={!currentUser}
        >
          ✍️ Write a Review
        </button>
      </div>

      {/* Rating Summary */}
      <div className="rating-summary">
        <div className="average-rating">
          <div className="rating-number">{averageRating}</div>
          <div className="rating-stars">{renderStars(Math.round(averageRating))}</div>
          <div className="rating-count">{reviews.length} reviews</div>
        </div>

        <div className="rating-breakdown">
          {[5, 4, 3, 2, 1].map(stars => (
            <div key={stars} className="rating-bar">
              <span className="stars-label">{stars} stars</span>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ 
                    width: `${reviews.length > 0 ? (ratingDistribution[stars] / reviews.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="count-label">({ratingDistribution[stars]})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="modal-overlay">
          <div className="modal-content review-form-modal">
            <div className="modal-header">
              <h3>Write a Review</h3>
              <button onClick={() => setShowReviewForm(false)} className="close-btn">×</button>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label>Rating</label>
                <div className="star-rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${newReview.rating >= star ? 'active' : ''}`}
                      onClick={() => setNewReview({...newReview, rating: star})}
                    >
                      ⭐
                    </button>
                  ))}
                  <span className="rating-text">
                    {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Visit Type</label>
                <select
                  value={newReview.visitType}
                  onChange={(e) => setNewReview({...newReview, visitType: e.target.value})}
                >
                  <option value="dine-in">🍽️ Dine-in</option>
                  <option value="takeout">🥡 Takeout</option>
                  <option value="delivery">🚚 Delivery</option>
                </select>
              </div>

              <div className="form-group">
                <label>Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  placeholder="Share your experience... What did you like? What could be improved?"
                  rows="4"
                  required
                />
              </div>

              <div className="form-buttons">
                <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.user?.name || "Anonymous"}</span>
                  <span className="review-date">{formatDate(review.createdAt)}</span>
                </div>
                <div className="review-meta">
                  <span className="visit-type">{review.visitType}</span>
                  <div className="review-rating">{renderStars(review.rating)}</div>
                </div>
              </div>
              <p className="review-comment">{review.comment}</p>
              
              {review.response && (
                <div className="owner-response">
                  <strong>Owner Response:</strong>
                  <p>{review.response}</p>
                  <small>Responded on {formatDate(review.responseDate)}</small>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}