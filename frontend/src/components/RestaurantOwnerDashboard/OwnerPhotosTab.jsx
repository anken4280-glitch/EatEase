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
        `http://localhost:8000/api/restaurants/${restaurantId}/photos`,
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
        <h3>Photos</h3>
        <div className="upload-section">
          <label htmlFor="photo-upload" className="upload-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="black"
            >
              <path d="M440-120v-320H120v-80h320v-320h80v320h320v80H520v320h-80Z" />
            </svg>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            fill="gray"
            viewBox="0 0 256 256"
          >
            <path d="M198.24,62.63l15.68-17.25a8,8,0,0,0-11.84-10.76L186.4,51.86A95.95,95.95,0,0,0,57.76,193.37L42.08,210.62a8,8,0,1,0,11.84,10.76L69.6,204.14A95.95,95.95,0,0,0,198.24,62.63ZM48,128A80,80,0,0,1,175.6,63.75l-107,117.73A79.63,79.63,0,0,1,48,128Zm80,80a79.55,79.55,0,0,1-47.6-15.75l107-117.73A79.95,79.95,0,0,1,128,208Z"></path>
          </svg>
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
