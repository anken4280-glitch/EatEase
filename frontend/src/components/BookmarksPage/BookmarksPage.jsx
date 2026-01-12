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
        <button className="bookmarks-back-button" onClick={onBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="black"
          >
            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
          </svg>
        </button>
        <h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="orange"
          >
            <path d="M713-600 600-713l56-57 57 57 141-142 57 57-198 198ZM200-120v-640q0-33 23.5-56.5T280-840h240v80H280v518l200-86 200 86v-278h80v400L480-240 200-120Zm80-640h240-240Z" />
          </svg>{" "}
          My Bookmarks
        </h1>
      </div>

      {loading && (
        <div className="loading-state">
          <p>Loading bookmarks</p>
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
              <div className="empty-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="40px"
                  viewBox="0 -960 960 960"
                  width="40px"
                  fill="black"
                >
                  <path d="M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 100q-68 0-123.5 38.5T276-280h66q22-37 58.5-58.5T480-360q43 0 79.5 21.5T618-280h66q-25-63-80.5-101.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
                </svg>
              </div>
              <h3>No bookmarks yet</h3>
              <p>Bookmark restaurants you like to find them quickly here</p>
            </div>
          ) : (
            <div className="bookmarks-container">
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
