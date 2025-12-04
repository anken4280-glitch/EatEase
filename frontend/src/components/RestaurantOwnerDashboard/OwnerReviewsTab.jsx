import React, { useState, useEffect } from 'react';

const OwnerReviewsTab = ({ restaurantId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/reviews`);
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setLoading(false);
    }
  };

  const handleSendResponse = async (reviewId) => {
    // Implement response sending logic
    console.log('Sending response to review:', reviewId, responseText);
    setRespondingTo(null);
    setResponseText('');
  };

  return (
    <div className="owner-reviews-tab">
      <div className="tab-header">
        <h3>⭐ Customer Reviews</h3>
        <div className="stats-summary">
          <span className="total-reviews">{reviews.length} reviews</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h4>No Reviews Yet</h4>
          <p>Reviews from customers will appear here.</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.user?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="reviewer-details">
                    <span className="reviewer-name">{review.user?.name || 'Customer'}</span>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="review-rating">
                  {'⭐'.repeat(review.rating || 0)}
                </div>
              </div>
              
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}

              {review.response ? (
                <div className="owner-response">
                  <strong>Your Response:</strong>
                  <p>{review.response}</p>
                </div>
              ) : respondingTo === review.id ? (
                <div className="response-form">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response..."
                    rows="3"
                  />
                  <div className="response-actions">
                    <button onClick={() => setRespondingTo(null)}>Cancel</button>
                    <button 
                      onClick={() => handleSendResponse(review.id)}
                      disabled={!responseText.trim()}
                    >
                      Send Response
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="respond-btn"
                  onClick={() => setRespondingTo(review.id)}
                >
                  💬 Respond to Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerReviewsTab;