import React, { useState, useEffect } from "react";
import "./BookmarksPage.css";

function BookmarksPage({ user, onBack }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Please login to view bookmarks");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/bookmarks", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setBookmarks(data.bookmarks || []);
      } else {
        setError(data.message || "Failed to load bookmarks");
      }
    } catch (err) {
      console.error("Bookmarks fetch error:", err);
      setError("Failed to load bookmarks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (restaurantId) => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost:8000/api/bookmarks/${restaurantId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success && !data.isBookmarked) {
        // Remove from local state
        setBookmarks(bookmarks.filter((b) => b.restaurant_id !== restaurantId));
      }
    } catch (error) {
      console.error("Remove bookmark error:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bookmarks-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>⭐ My Bookmarks</h1>
      </div>

      {loading && (
        <div className="loading-state">
          <p>Loading bookmarks...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchBookmarks}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <h3>No bookmarks yet</h3>
              <p>Bookmark restaurants you like to find them quickly here</p>
            </div>
          ) : (
            <div className="bookmarks-container">
              <p className="bookmarks-count">
                {bookmarks.length} bookmarked restaurant(s)
              </p>

              <div className="bookmarks-list">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bookmark-item">
                    <div className="bookmark-info">
                      <h3>{bookmark.restaurant_name}</h3>
                      <p className="cuisine">{bookmark.cuisine}</p>
                      <p className="address">{bookmark.address}</p>
                      <p className="bookmarked-date">
                        Bookmarked on {formatDate(bookmark.created_at)}
                      </p>
                    </div>

                    <div className="bookmark-actions">
                      <button
                        className="remove-btn"
                        onClick={() =>
                          handleRemoveBookmark(bookmark.restaurant_id)
                        }
                        title="Remove bookmark"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BookmarksPage;
