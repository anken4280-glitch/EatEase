import React, { useState, useEffect } from "react";
import "../RestaurantDetails/RestaurantDetails.css";

const ReviewsTab = ({ restaurantId, restaurantName }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReview, setUserReview] = useState(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    console.log("ReviewsTab mounted for restaurant:", restaurantId);

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log("User set:", parsedUser.name);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    fetchReviews();
  }, [restaurantId]);

  const fetchReviews = async () => {
    console.log("Fetching reviews...");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/restaurants/${restaurantId}/reviews`
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Reviews data received:", data);

      // Check if API returned success
      if (data.success !== false) {
        setReviews(data.reviews || []);
        setAverageRating(data.average_rating || 0);
        setTotalReviews(data.total_reviews || 0);
        setUserReview(data.user_review || null);

        // Pre-fill form if user has reviewed
        if (data.user_review) {
          setNewReview({
            rating: data.user_review.rating,
            comment: data.user_review.comment || "",
          });
        }

        console.log("Reviews state updated. Count:", data.reviews?.length || 0);
      } else {
        setError(data.error || "Failed to load reviews");
        console.error("API error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
      console.log("Loading set to false");
    }
  };

  const submitReview = async () => {
    if (!user || user.user_type !== "diner") {
      alert("Only diners can submit reviews");
      return;
    }

    if (!newReview.comment.trim()) {
      alert("Please add a comment to your review");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("auth_token");

    try {
      const response = await fetch(
        `http://localhost:8000/api/restaurants/${restaurantId}/reviews`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newReview),
        }
      );

      const data = await response.json();
      console.log("Submit review response:", data);

      if (data.success) {
        await fetchReviews();
        alert(userReview ? "Review updated!" : "Review submitted!");
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost:8000/api/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        await fetchReviews();
        alert("Review deleted");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting review");
    }
  };

  const renderStars = (rating, interactive = false, onClick = null) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? "filled" : ""} ${
              interactive ? "interactive" : ""
            }`}
            onClick={() => interactive && onClick && onClick(star)}
            style={{
              cursor: interactive ? "pointer" : "default",
              fontSize: "24px",
              margin: "0 2px",
              color: star <= rating ? "#FFD700" : "#ddd",
            }}
          >
            {star <= rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  const getFilteredReviews = () => {
    if (activeFilter === "all") return reviews;
    return reviews.filter((review) => review.rating === parseInt(activeFilter));
  };

  const renderRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            className={`distribution-item ${
              activeFilter === stars.toString() ? "active" : ""
            }`}
            onClick={() => setActiveFilter(stars.toString())}
          >
            <span className="stars-count">{stars} ★</span>
            <div className="distribution-bar">
              <div
                className="bar-fill"
                style={{
                  width: `${
                    totalReviews
                      ? (distribution[stars] / totalReviews) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <span className="distribution-count">{distribution[stars]}</span>
          </button>
        ))}
        <button
          className={`distribution-item ${
            activeFilter === "all" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("all")}
        >
          <span className="stars-count">All</span>
          <span className="distribution-count">{totalReviews}</span>
        </button>
      </div>
    );
  };

  // Add debug logging
  console.log("Component state:", {
    loading,
    error,
    reviewsCount: reviews.length,
    averageRating,
    totalReviews,
    user: user?.name,
  });

  if (loading) {
    return (
      <div className="reviews-tab loading">
        <div className="spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reviews-tab error-state">
        <div className="error-icon">⚠️</div>
        <h3>Could not load reviews</h3>
        <p>{error}</p>
        <button onClick={fetchReviews} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  const filteredReviews = getFilteredReviews();

  return (
    <div className="reviews-tab">
      {/* Rating Summary */}
      <div className="rating-summary-card">
        <div className="rating-overview">
          <div className="average-rating">
            <span className="rating-number">{averageRating.toFixed(1)}</span>
            <span className="rating-max">/5</span>
          </div>
          {renderStars(Math.round(averageRating))}
          <p className="total-reviews">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {/* Review Form for Diners */}
      {user && user.user_type === "diner" && (
        <div className="review-form-card">
          <h3>{userReview ? "Edit Your Review" : "Write a Review"}</h3>

          <div className="form-group">
            <label>Rate:</label>
            <div className="star-rating-input">
              {renderStars(newReview.rating, true, (rating) =>
                setNewReview({ ...newReview, rating })
              )}
              <span className="selected-rating">
                {newReview.rating} out of 5
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Review:</label>
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              placeholder={`Share your experience at ${restaurantName}`}
              rows="4"
              maxLength="1000"
            />
          </div>

          <div className="form-actions">
            <button
              onClick={submitReview}
              disabled={submitting || !newReview.comment.trim()}
              className="submit-btn"
            >
              {submitting
                ? "Submitting..."
                : userReview
                ? "Update Review"
                : "Submit"}
            </button>

            {userReview && (
              <button
                onClick={() => deleteReview(userReview.id)}
                className="delete-btn"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list-section">
        <h2>Reviews</h2>
        <div className="reviews-list">
          {filteredReviews.length === 0 ? (
            <div className="no-reviews">
              <p>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="review-card">
                {/* Top Row: Avatar + Name + Date + Delete Button */}
                <div className="review-header">
                  {/* Left: Avatar and Name */}
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {review.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className="reviewer-details">
                      <div className="reviewer-name-date">
                        <span className="reviewer-name">
                          {review.user?.name || "Anonymous"}
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

                  {/* Right: Delete Button (if user's review) */}
                  {user && review.user_id === user.id && (
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="review-delete-btn"
                      title="Delete your review"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {/* Bottom: Review Comment */}
                {review.comment && (
                  <div className="review-content">
                    <p className="review-comment">{review.comment}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsTab;
