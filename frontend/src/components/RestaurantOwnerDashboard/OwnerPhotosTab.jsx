import React, { useState, useEffect } from "react";

const OwnerPhotosTab = ({ restaurantId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [restaurantId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/restaurants/${restaurantId}/photos`
      );
      const data = await response.json();
      setPhotos(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setPhotos([]);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    // Implement photo upload logic here
    console.log("Uploading photos:", files);
    setUploading(false);
  };

  const setAsPrimary = async (photoId) => {
    // Implement set as primary logic
    console.log("Setting as primary:", photoId);
  };

  return (
    <div className="owner-photos-tab">
      <div className="tab-header">
        <h3>Restaurant Photos</h3>
        <div className="upload-section">
          <label htmlFor="photo-upload" className="upload-btn">
            {uploading ? "Uploading..." : "Upload Photos"}
          </label>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h4>No Photos Yet</h4>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <div className="photo-container">
                <img
                  src={photo.image_url || "https://via.placeholder.com/200"}
                  alt={photo.caption || "Restaurant photo"}
                />
                {photo.is_primary && (
                  <span className="primary-badge">⭐ Primary</span>
                )}
              </div>
              <div className="photo-actions">
                <button
                  className="set-primary-btn"
                  onClick={() => setAsPrimary(photo.id)}
                  disabled={photo.is_primary}
                >
                  {photo.is_primary ? "✓ Primary" : "Set as Primary"}
                </button>
                <button className="delete-photo-btn">Delete</button>
              </div>
              {photo.caption && (
                <p className="photo-caption">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerPhotosTab;
