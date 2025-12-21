import React, { useState, useEffect } from 'react';
import "./OwnerReviewsTab.css";

const OwnerReviewsTab = ({ restaurantId, restaurantName }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [stats, setStats] = useState({
    ratingDistribution: {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
    recentReviews: 0,
    averageRating: 0
  });
  const [filter, setFilter] = useState('all'); // 'all', 'recent', '5', '4', etc.

  useEffect(() => {
    console.log('OwnerReviewsTab: Loading reviews for restaurant', restaurantId);
    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/reviews`);
      const data = await response.json();
      console.log('Owner reviews API response:', data);
      
      if (data.success) {
        setReviews(data.reviews || []);
        setAverageRating(data.average_rating || 0);
        setTotalReviews(data.total_reviews || 0);
        
        // Calculate stats
        const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        (data.reviews || []).forEach(review => {
          distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        });
        
        // Count recent reviews (last 30 days)
        const recentReviews = (data.reviews || []).filter(r => {
          const reviewDate = new Date(r.created_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return reviewDate >= monthAgo;
        }).length;
        
        setStats({
          ratingDistribution: distribution,
          recentReviews: recentReviews,
          averageRating: data.average_rating || 0
        });
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async (reviewId) => {
    // TODO: Implement backend API for responses
    console.log('Sending response to review:', reviewId, responseText);
    
    // For now, just show success message
    alert('Response sent! (Backend integration needed)');
    setRespondingTo(null);
    setResponseText('');
  };

  const deleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This cannot be undone.')) return;
    
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchReviews();
        alert('Review deleted successfully');
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            style={{ 
              color: star <= rating ? '#FFD700' : '#ddd',
              fontSize: '18px'
            }}
          >
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const getFilteredReviews = () => {
    let filtered = [...reviews];
    
    // Filter by rating
    if (filter !== 'all' && filter !== 'recent') {
      filtered = filtered.filter(r => r.rating === parseInt(filter));
    }
    
    // Sort if recent
    if (filter === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return filtered;
  };

  const renderRatingDistribution = () => {
    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map(stars => {
          const count = stats.ratingDistribution[stars] || 0;
          const percentage = totalReviews ? (count / totalReviews * 100) : 0;
          
          return (
            <div key={stars} className="distribution-row">
              <span className="stars-label">{stars} ★</span>
              <div className="percentage-bar">
                <div 
                  className="bar-fill" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="percentage-value">{percentage.toFixed(0)}%</span>
              <span className="count-value">({count})</span>
            </div>
          );
        })}
      </div>
    );
  };

  const filteredReviews = getFilteredReviews();

  if (loading) {
    return (
      <div className="owner-reviews-tab loading">
        <div className="spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="owner-reviews-tab">
      {/* Header with Stats */}
      <div className="owner-reviews-header">
        <h2>Reviews</h2>
        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-value">{averageRating.toFixed(1)}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">{totalReviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">{stats.recentReviews}</div>
            <div className="stat-label">Recent (30 days)</div>
          </div>
        </div>
      </div>

      {/* Rating Distribution & Filters */}
      <div className="reviews-dashboard">
        <div className="dashboard-left">
          <div className="distribution-card">
            <h4>Rating</h4>
            {renderRatingDistribution()}
          </div>
        </div>

        {/* Reviews List */}
        <div className="dashboard-right">
          <div className="reviews-list-header">
            <h3>
              {filter === 'all' ? 'All Reviews' : 
               filter === 'recent' ? 'Recent Reviews' :
               filter === '5' ? '5-Star Reviews' :
               filter === '1' ? '1-Star Reviews' :
               `${filter}-Star Reviews`} 
              ({filteredReviews.length})
            </h3>
            <button 
              onClick={fetchReviews}
              className="refresh-btn"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h4>No Reviews Found</h4>
              <p>No reviews match your current filter.</p>
              <button 
                className="reset-filter-btn"
                onClick={() => setFilter('all')}
              >
                Show All Reviews
              </button>
            </div>
          ) : (
            <div className="reviews-list">
              {filteredReviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.user?.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="reviewer-details">
                        <span className="reviewer-name">
                          {review.user?.name || 'Anonymous Customer'}
                        </span>
                        <span className="review-date">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                        <span className="review-time">
                          {new Date(review.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    
                    <div className="review-rating-section">
                      <button 
                        onClick={() => deleteReview(review.id)}
                        className="delete-review-btn"
                        title="Delete this review"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {review.comment && (
                    <div className="review-content">
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  )}
                  
                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="review-images">
                      {review.images.slice(0, 3).map((image, index) => (
                        <div key={index} className="review-image">
                          <img src={image} alt={`Review ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Owner Response Section */}
                  {review.response ? (
                    <div className="owner-response">
                      <div className="response-header">
                        <strong>👨‍🍳 Your Response:</strong>
                        <span className="response-date">
                          {new Date(review.response.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="response-text">{review.response.text}</p>
                      <button 
                        className="edit-response-btn"
                        onClick={() => {
                          setRespondingTo(review.id);
                          setResponseText(review.response.text);
                        }}
                      >
                        Edit Response
                      </button>
                    </div>
                  ) : respondingTo === review.id ? (
                    <div className="response-form">
                      <strong>Write a Response:</strong>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows="3"
                      />
                      <div className="response-actions">
                        <button 
                          onClick={() => setRespondingTo(null)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSendResponse(review.id)}
                          disabled={!responseText.trim()}
                          className="send-btn"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="respond-btn"
                      onClick={() => {
                        setRespondingTo(review.id);
                        setResponseText('');
                      }}
                    >
                      Reply
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerReviewsTab;