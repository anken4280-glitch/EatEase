import React, { useState } from "react";
import "./ImageUpload.css";

function ImageUpload({ type, currentImage, onUploadSuccess, restaurantId }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(currentImage || null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload
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
        `http://localhost:8000/api/restaurant/upload/${type}`,
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
        onUploadSuccess(data.url, data.path);
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
      <div className="upload-area">
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt={`${type} preview`} className="preview-image" />
            <div className="preview-overlay">
              <label className="upload-button">
                {uploading ? "Uploading..." : `Change ${type} image`}
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