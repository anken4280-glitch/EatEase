import React from "react";
import "../RestaurantDetails/RestaurantDetails.css";

const OverviewTab = ({ restaurant, stats }) => {
  return (
    <div className="overview-tab">
      {/* Basic Information */}
      <div className="info-section">
        <div className="section-title">
          <svg
            className="location-icon"
            width="20"
            height="20"
            viewBox="0 -960 960 960"
            fill="red"
            aria-hidden="true"
          >
            <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
          </svg>
          <h3 className="section-title" id="section-title-location">
            Location:
          </h3>
        </div>
        <p className="section-content">{restaurant.address}</p>
      </div>

      <div className="info-section">
        <h3 className="section-title">
          <svg
            width="20"
            height="20"
            viewBox="0 -960 960 960"
            fill="blue"
            aria-hidden="true"
          >
            <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" />
          </svg>
          Contact:
        </h3>
        <p className="section-content">{restaurant.phone || "Not provided"}</p>
      </div>

      <div className="info-section">
        <h3 className="section-title">
          <svg
            width="20"
            height="20"
            viewBox="0 -960 960 960"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
          </svg>
          Operating Hours:
        </h3>
        <p className="section-content">{restaurant.hours || "Not specified"}</p>
      </div>

      {/* Features/Amenities */}
      {restaurant.features && restaurant.features.length > 0 && (
        <div className="info-section">
          <h3 className="section-title">
            <svg
              width="20"
              height="20"
              viewBox="0 -960 960 960"
              fill="green"
              aria-hidden="true"
            >
              <path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
            Features:
          </h3>
          <div className="features-grid">
            {restaurant.features.map((feature, index) => (
              <span key={index} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Restaurant Description */}
      {/* <div className="info-section">
        <h3 className="section-title">About</h3>
        <p className="section-content description">
          {restaurant.description || 
           `Welcome to ${restaurant.name}! Enjoy delicious ${restaurant.cuisine_type} cuisine.`}
        </p>
      </div> */}
    </div>
  );
};

export default OverviewTab;
