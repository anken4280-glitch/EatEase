import React, { useState, useEffect } from "react";
import "../RestaurantDetails/RestaurantDetails.css";

const PhotosTab = ({ restaurantId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  useEffect(() => {
    fetchPhotos();
  }, [restaurantId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/restaurants/${restaurantId}/photos`
      );
      const data = await response.json();
      setPhotos(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setLoading(false);
    }
  };

  const openPhotoViewer = (photo) => {
    setSelectedPhoto(photo);
  };

  const closePhotoViewer = () => {
    setSelectedPhoto(null);
  };

  const navigatePhoto = (direction) => {
    if (!selectedPhoto) return;

    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    let newIndex;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % photos.length;
    } else {
      newIndex = (currentIndex - 1 + photos.length) % photos.length;
    }

    setSelectedPhoto(photos[newIndex]);
  };

  if (loading) {
    return (
      <div className="photos-tab loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="photos-tab empty">
        <div className="empty-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="50px"
            viewBox="0 -960 960 960"
            width="50px"
            fill="#000000"
          >
            <path d="m880-195-80-80v-405H638l-73-80H395l-38 42-57-57 60-65h240l74 80h126q33 0 56.5 23.5T880-680v485Zm-720 75q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h41l80 80H160v480h601l80 80H160Zm466-215q-25 34-62.5 54.5T480-260q-75 0-127.5-52.5T300-440q0-46 20.5-83.5T375-586l58 58q-24 13-38.5 36T380-440q0 42 29 71t71 29q29 0 52-14.5t36-38.5l58 58Zm-18-233q25 24 38.5 57t13.5 71v12q0 6-1 12L456-619q6-1 12-1h12q38 0 71 13.5t57 38.5ZM819-28 27-820l57-57L876-85l-57 57ZM407-440Zm171-57Z" />
          </svg>
        </div>
        <h3>No Photos Yet</h3>
      </div>
    );
  }

  return (
    <div className="photos-tab">
      {/* Photo Gallery Header */}
      <div className="photos-header">
        <h3 className="photos-title">📸 Photo Gallery</h3>
        <div className="photos-controls">
          <span className="photos-count">{photos.length} photos</span>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              ⏹️
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {/* Primary Photo (if exists) */}
      {photos.find((p) => p.is_primary) && (
        <div className="primary-photo-section">
          <h4 className="section-subtitle">🌟 Featured Photo</h4>
          <div
            className="primary-photo"
            onClick={() => openPhotoViewer(photos.find((p) => p.is_primary))}
          >
            <img
              src={photos.find((p) => p.is_primary).image_url}
              alt={photos.find((p) => p.is_primary).caption || "Featured photo"}
            />
            <div className="primary-badge">Featured</div>
            {photos.find((p) => p.is_primary).caption && (
              <p className="photo-caption">
                {photos.find((p) => p.is_primary).caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* All Photos Grid/List */}
      <div className={`photos-container ${viewMode}`}>
        {viewMode === "grid" ? (
          <div className="photos-grid">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="photo-item"
                onClick={() => openPhotoViewer(photo)}
              >
                <div className="photo-thumbnail">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || `Restaurant photo ${photo.id}`}
                    loading="lazy"
                  />
                  {photo.is_primary && (
                    <span className="primary-indicator">⭐</span>
                  )}
                </div>
                {photo.caption && (
                  <p className="photo-caption-small">{photo.caption}</p>
                )}
                <div className="photo-meta">
                  <span className="upload-date">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="photos-list">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="photo-list-item"
                onClick={() => openPhotoViewer(photo)}
              >
                <div className="list-photo-thumb">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || `Restaurant photo ${photo.id}`}
                  />
                </div>
                <div className="list-photo-info">
                  <div className="list-photo-header">
                    {photo.is_primary && (
                      <span className="list-primary-badge">Featured</span>
                    )}
                    <span className="list-upload-date">
                      {new Date(photo.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {photo.caption && (
                    <p className="list-photo-caption">{photo.caption}</p>
                  )}
                  <div className="list-photo-actions">
                    <button className="action-like-btn">❤️ Like</button>
                    <button className="action-share-btn">↗️ Share</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="upload-section">
        <button className="upload-photo-btn">📤 Add Photos</button>
        <p className="upload-note">Share your dining experience with others</p>
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="photo-viewer-modal" onClick={closePhotoViewer}>
          <div
            className="photo-viewer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-viewer-btn" onClick={closePhotoViewer}>
              ✕
            </button>

            <div className="viewer-photo-container">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.caption || "Selected photo"}
                className="viewer-photo"
              />

              <button
                className="nav-btn prev-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto("prev");
                }}
              >
                ←
              </button>

              <button
                className="nav-btn next-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto("next");
                }}
              >
                →
              </button>
            </div>

            <div className="viewer-info">
              {selectedPhoto.caption && (
                <p className="viewer-caption">{selectedPhoto.caption}</p>
              )}
              <div className="viewer-meta">
                <span className="viewer-date">
                  Uploaded:{" "}
                  {new Date(selectedPhoto.created_at).toLocaleDateString()}
                </span>
                {selectedPhoto.is_primary && (
                  <span className="viewer-featured">⭐ Featured Photo</span>
                )}
              </div>
              <div className="viewer-actions">
                <button className="viewer-like-btn">❤️ Like</button>
                <button className="viewer-download-btn">⬇️ Download</button>
                <button className="viewer-share-btn">↗️ Share</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotosTab;
