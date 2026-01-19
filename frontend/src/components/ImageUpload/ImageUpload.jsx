import React, { useState, useRef, useEffect } from "react";
import "./ImageUpload.css";

function ImageUpload({ type, currentImage, onUploadSuccess, restaurantId }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // Only for new file preview
  const [currentImageDisplay, setCurrentImageDisplay] = useState(currentImage || null);
  const fileInputRef = useRef(null);

  // Set current image URL when currentImage prop changes
  useEffect(() => {
    if (currentImage) {
      let url = currentImage;
      
      // Check if it's already a full URL
      if (url && !url.startsWith('http')) {
        // If it's just a path, prepend with storage URL
        url = `http://localhost:8000/storage/${url}`;
      }
      
      setCurrentImageDisplay(url);
    } else {
      setCurrentImageDisplay(null);
    }
  }, [currentImage]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setError("");
    
    // Create preview for NEW file only
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload the file
    uploadImage(file);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurant/upload/${type}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update the displayed image
        if (data.url) {
          setCurrentImageDisplay(data.url);
        }
        
        if (onUploadSuccess) {
          onUploadSuccess(data.url, data.path);
        }
        
        // Clear the preview
        setPreview(null);
        
        // Clear the file input using the ref
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        alert(`${type === "profile" ? "Profile" : "Banner"} image uploaded successfully!`);
      } else {
        setError(data.message || "Upload failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`image-upload ${type}`}>
      <h3>{type === "profile" ? "Profile Image" : "Banner Image"}</h3>
      
      {/* Display current image if it exists */}
      {currentImageDisplay && (
        <div className="current-image-section">
          <h4>Current Image:</h4>
          <img 
            src={currentImageDisplay} 
            alt={`Current ${type}`}
            className="current-image"
            onError={(e) => {
              console.error("Image failed to load:", currentImageDisplay);
              // Try to fix the URL if it's broken
              if (currentImageDisplay && !currentImageDisplay.includes('/storage/')) {
                e.target.src = `http://localhost:8000/storage/${currentImageDisplay}`;
              }
            }}
          />
        </div>
      )}

      {/* Upload area - this only shows when previewing a NEW file */}
      <div className="upload-area">
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt={`${type} preview`} className="preview-image" />
            <div className="preview-overlay">
              <label className="upload-button">
                {uploading ? "Uploading..." : `Upload ${type} image`}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  hidden
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              {uploading ? "Uploading..." : `Upload ${type} image`}
            </div>
            <div className="upload-hint">Click to select image</div>
            <div className="upload-requirements">JPG, PNG, GIF, WebP • Max 5MB</div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              hidden
            />
          </label>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {type === "banner" && (
        <div className="banner-options">
          <label>Banner Position:</label>
          <select
            onChange={(e) => {
              // Optional: Add API call to update banner position
              console.log("Position changed to:", e.target.value);
            }}
          >
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;