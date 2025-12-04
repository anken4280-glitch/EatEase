import React, { useState, useEffect } from 'react';
import '../RestaurantDetails/RestaurantDetails.css';

const PhotosTab = ({ restaurantId }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchPhotos();
  }, [restaurantId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/restaurants/${restaurantId}/photos`);
      const data = await response.json();
      setPhotos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching photos:', error);
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
    
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    let newIndex;
    
    if (direction === 'next') {
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
        <p>Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="photos-tab empty">
        <div className="empty-icon">📸</div>
        <h3>No Photos Yet</h3>
        <p>Be the first to add photos of this restaurant!</p>
        <button className="upload-photo-btn">
          📤 Upload Photo
        </button>
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
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⏹️
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {/* Primary Photo (if exists) */}
      {photos.find(p => p.is_primary) && (
        <div className="primary-photo-section">
          <h4 className="section-subtitle">🌟 Featured Photo</h4>
          <div 
            className="primary-photo"
            onClick={() => openPhotoViewer(photos.find(p => p.is_primary))}
          >
            <img 
              src={photos.find(p => p.is_primary).image_url} 
              alt={photos.find(p => p.is_primary).caption || "Featured photo"}
            />
            <div className="primary-badge">Featured</div>
            {photos.find(p => p.is_primary).caption && (
              <p className="photo-caption">{photos.find(p => p.is_primary).caption}</p>
            )}
          </div>
        </div>
      )}

      {/* All Photos Grid/List */}
      <div className={`photos-container ${viewMode}`}>
        {viewMode === 'grid' ? (
          <div className="photos-grid">
            {photos.map(photo => (
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
            {photos.map(photo => (
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
        <button className="upload-photo-btn">
          📤 Add Your Photos
        </button>
        <p className="upload-note">
          Share your dining experience with others
        </p>
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="photo-viewer-modal" onClick={closePhotoViewer}>
          <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
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
                  navigatePhoto('prev');
                }}
              >
                ←
              </button>
              
              <button 
                className="nav-btn next-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('next');
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
                  Uploaded: {new Date(selectedPhoto.created_at).toLocaleDateString()}
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