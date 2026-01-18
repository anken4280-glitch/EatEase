import React from "react";
import "./OwnerOverviewTab.css";

const OwnerOverviewTab = ({ restaurant, onEdit }) => {
  return (
    <div className="owner-overview-tab">
      <div className="tab-section">
        <div className="section-header">
          <h3>Location & Contact</h3>
          <button className="section-edit-btn" onClick={onEdit}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="17px"
              viewBox="0 -960 960 960"
              width="17px"
              fill="black"
            >
              <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
            </svg>
          </button>
        </div>

        <div className="info-grid">
          <div className="info-section">
            <div className="section-title">
              <h3 className="section-title" id="section-title-location">
                <svg
                  className="location-icon"
                  width="20"
                  height="20"
                  viewBox="0 -960 960 960"
                  fill="black"
                  aria-hidden="true"
                >
                  <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                </svg>
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
                fill="black"
                aria-hidden="true"
              >
                <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" />
              </svg>
              Contact:
            </h3>
            <p className="section-content">
              {restaurant.phone || "Not provided"}
            </p>
          </div>

          <div className="info-section">
            <h3 className="section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 -960 960 960"
                fill="black"
                aria-hidden="true"
              >
                <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
              </svg>
              Operating Hours:
            </h3>
            <p className="section-content">
              {restaurant.hours || "Not specified"}
            </p>
          </div>
          <div className="info-section">
            <h3 className="section-title">
              <svg
                width="20"
                height="20"
                viewBox="0 -960 960 960"
                fill="black"
                aria-hidden="true"
              >
                <path d="m175-120-56-56 410-410q-18-42-5-95t57-95q53-53 118-62t106 32q41 41 32 106t-62 118q-42 44-95 57t-95-5l-50 50 304 304-56 56-304-302-304 302Zm118-342L173-582q-54-54-54-129t54-129l248 250-128 128Z" />
              </svg>
              Cuisine:
            </h3>
            <p className="section-content">
              {restaurant.cuisine_type || "Not specified"}
            </p>
          </div>
        </div>
      </div>

      <div className="tab-section">
        <div className="section-header">
          <h3>Features & Amenities</h3>
          <button className="section-edit-btn" onClick={onEdit}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="17px"
              viewBox="0 -960 960 960"
              width="17px"
              fill="black"
            >
              <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
            </svg>
          </button>
        </div>

        {restaurant.features && restaurant.features.length > 0 ? (
          <div className="features-list">
            {restaurant.features.map((feature, index) => (
              <span key={index} className="feature-tag">
                {feature}
              </span>
            ))}
          </div>
        ) : (
          <p className="no-features">No features added yet.</p>
        )}
      </div>

      <div className="tab-section">
        <div className="section-header">
          <h3>Current Status</h3>
          <button className="section-edit-btn" onClick={onEdit}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="17px"
              viewBox="0 -960 960 960"
              width="17px"
              fill="black"
            >
              <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
            </svg>
          </button>
        </div>

        <div className="status-info">
          <div className="status-item">
            <span className="status-label">Crowd Level:</span>
            <span className={`status-value status-${restaurant.crowd_status}`}>
              {restaurant.crowd_status === "green"
                ? "Low"
                : restaurant.crowd_status === "yellow"
                  ? "Moderate"
                  : restaurant.crowd_status === "orange"
                    ? "Busy"
                    : "Very High"}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Capacity:</span>
            <span className="status-value">
              {restaurant.current_occupancy}/{restaurant.max_capacity} people
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Occupancy:</span>
            <span className="status-value">
              {restaurant.occupancy_percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerOverviewTab;
