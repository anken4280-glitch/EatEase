import React, { useState, useEffect, useRef } from "react";
import "./OwnerPhotosTab.css";

const OwnerPhotosTab = ({ restaurant }) => {
  // Extract restaurantId from restaurant object
  const restaurantId = restaurant?.id;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [captions, setCaptions] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log("OwnerPhotosTab mounted with restaurant:", restaurant);
    console.log("Extracted restaurantId:", restaurantId);

    if (restaurantId) {
      console.log("Fetching photos for restaurantId:", restaurantId);
      fetchPhotos();
    } else {
      console.error("No restaurantId provided to OwnerPhotosTab");
      setError("No restaurant selected");
      setLoading(false);
    }
  }, [restaurantId]);

  const fetchPhotos = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("auth_token");
      console.log("Fetching photos with token:", token ? "exists" : "missing");

      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurant/${restaurantId}/photos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      console.log("Photos API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Photos API response data:", data);
        setPhotos(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error("Photos API error:", response.status, errorText);
        setError(`Failed to load photos: ${response.status}`);
        setPhotos([]);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
      setError("Network error loading photos");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter((file) => {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidType) {
        alert(
          `${file.name} is not a valid image type (JPEG, PNG, GIF, WebP allowed)`,
        );
        return false;
      }

      if (!isValidSize) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setShowUploadModal(true);

      // Initialize captions
      const initialCaptions = {};
      validFiles.forEach((file, index) => {
        initialCaptions[index] = "";
      });
      setCaptions(initialCaptions);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const formData = new FormData();

    // CORRECT FORMAT FOR LARAVEL:
    selectedFiles.forEach((file, index) => {
      formData.append("photos[]", file); // Use 'photos[]' not 'photos[0]'

      if (captions[index]) {
        // For captions, we can either use same format or pass as JSON
        formData.append("captions[]", captions[index]);
      }
    });

    // DEBUG: Log FormData
    console.log("FormData entries:");
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const token = localStorage.getItem("auth_token");

      // DEBUG: Log the request
      console.log(
        "Sending request to:",
        `http://localhost/EatEase/backend/public/api/restaurant/${restaurantId}/photos`,
      );
      console.log("Token exists:", !!token);

      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurant/${restaurantId}/photos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type - browser will set it with boundary
            Accept: "application/json",
          },
          body: formData,
        },
      );

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        alert(data.message);
        setShowUploadModal(false);
        setSelectedFiles([]);
        setCaptions({});
        fetchPhotos();
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading photos");
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurant/${restaurantId}/photos/${photoId}/primary`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setPhotos((prev) =>
          prev.map((photo) => ({
            ...photo,
            is_primary: photo.id === photoId,
          })),
        );
        alert("Primary photo updated!");
      } else {
        alert(data.message || "Failed to set primary");
      }
    } catch (error) {
      console.error("Set primary error:", error);
      alert("Error setting primary photo");
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurant/${restaurantId}/photos/${photoId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        // Remove from local state
        setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
        alert("Photo deleted!");
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting photo");
    }
  };

  const updateCaption = async (photoId, newCaption) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurant/${restaurantId}/photos/${photoId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ caption: newCaption }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setPhotos((prev) =>
          prev.map((photo) =>
            photo.id === photoId ? { ...photo, caption: newCaption } : photo,
          ),
        );
      } else {
        alert(data.message || "Failed to update caption");
      }
    } catch (error) {
      console.error("Update caption error:", error);
    }
  };

  if (!restaurantId) {
    return (
      <div className="owner-photos-tab error">
        <div className="error-message">
          <h3>No Restaurant Data</h3>
          <p>Unable to load restaurant information. Please try again.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="owner-photos-tab loading">
        <div className="loading-spinner"></div>
        <p>Loading photos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-photos-tab error">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchPhotos} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-photos-tab">
      <div className="tab-header">
        <div className="header-left">
          <h3>Restaurant Photos</h3>
        </div>
        <div className="header-right">
          <label htmlFor="photo-upload" className="upload-btn primary-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="white"
            >
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
            Upload Photos
          </label>
          <input
            id="photo-upload"
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="60"
              height="60"
              fill="#ccc"
              viewBox="0 0 256 256"
            >
              <path d="M228,160v40a20,20,0,0,1-20,20H48a20,20,0,0,1-20-20V56A20,20,0,0,1,48,36h80a4,4,0,0,1,0,8H48a12,12,0,0,0-12,12V164.81A36,36,0,0,1,48,148H208a36,36,0,0,1,36,36v12a4,4,0,0,1-8,0V184a28,28,0,0,0-28-28H48a28,28,0,0,0-28,28v36a12,12,0,0,0,12,12H208a12,12,0,0,0,12-12V160a4,4,0,0,1,8,0ZM92,112a12,12,0,1,0-12-12A12,12,0,0,0,92,112Zm116-76h40a4,4,0,0,1,4,4V92a4,4,0,0,1-8,0V48.49l-50.83,50.83a4,4,0,0,1-5.66-5.66L238.51,42H200a4,4,0,0,1,0-8Z"></path>
            </svg>
          </div>
          <h4>No Photos Yet</h4>
          <p>Upload photos to showcase your restaurant</p>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <div className="photo-container">
                <img
                  src={photo.full_image_url}
                  alt={photo.caption || "Restaurant photo"}
                  loading="lazy"
                />
                {photo.is_primary && (
                  <div className="primary-badge">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      fill="white"
                      viewBox="0 0 256 256"
                    >
                      <path d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"></path>
                    </svg>
                  </div>
                )}
              </div>
              <div className="photo-info">
                <div className="photo-actions">
                  <button
                    className={`set-primary-btn ${photo.is_primary ? "is-primary" : ""}`}
                    onClick={() => handleSetPrimary(photo.id)}
                    disabled={photo.is_primary}
                  >
                    {photo.is_primary ? "Primary" : "Set Primary"}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      fill="white"
                      viewBox="0 0 256 256"
                    >
                      <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                    </svg>
                  </button>
                </div>
                <div className="photo-meta">
                  <small>
                    Uploaded {new Date(photo.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>Upload Photos ({selectedFiles.length} selected)</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="selected-files">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-preview">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="preview-image"
                    />
                    <div className="file-info">
                      <p className="file-name">{file.name}</p>
                      <p className="file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="photos-modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  className="upload-confirm-btn"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPhotosTab;
