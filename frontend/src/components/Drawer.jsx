import React, { useEffect, useRef, useState } from "react";
import "../styles/drawer.css";

export default function Drawer({ isOpen, onClose, onLogout, user, userPreferences, setShowPreferencesModal, bookmarks = [] }) {
  const dropdownRef = useRef(null);
  const [activeContent, setActiveContent] = useState(null); // For Help, Bookmarks, Preferences

  // Close drawer/content when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
        setActiveContent(null);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
        setActiveContent(null);
      }
    };

    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleContent = (type) => {
    setActiveContent((prev) => (prev === type ? null : type));
  };

  const contentStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#2b2b2f",
    color: "white",
    padding: "16px",
    borderRadius: "8px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
    zIndex: 1000,
    minWidth: "220px",
    animation: "slideDown 0.3s ease-out"
  };

  const preferencesStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#fff",
    color: "#000",
    padding: "12px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: 1000,
    minWidth: "220px"
  };

  return (
    <>
      {/* Click-outside overlay */}
      <div
        className="dropdown-overlay"
        onClick={() => {
          onClose();
          setActiveContent(null);
        }}
      ></div>

      {/* Drawer Menu */}
      <div className="dropdown-small-menu" ref={dropdownRef}>
        <div className="dropdown-user">
          <div className="dropdown-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="dropdown-user-name">{user?.name || "User"}</p>
            <p className="dropdown-user-email">{user?.email || ""}</p>
          </div>
        </div>

        <div className="dropdown-divider"></div>

        {/* Set Preferences */}
        <button
          className="dropdown-small-item"
          onClick={() => toggleContent("preferences")}
        >
          <span className="item-icon">⚙️</span> Set Preferences
        </button>

        {/* Inline Preferences Popup */}
        {activeContent === "preferences" && (
          <div style={preferencesStyle}>
            <h4>Your Preferences</h4>
            {userPreferences ? (
              <ul style={{ paddingLeft: "1rem" }}>
                {Object.entries(userPreferences).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value.toString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No preferences set yet.</p>
            )}
            <button
              style={{ marginTop: "8px", width: "100%", padding: "8px", background: "#2563eb", color: "#fff", borderRadius: "6px", border: "none", cursor: "pointer" }}
              onClick={() => {
                setShowPreferencesModal(true);
                setActiveContent(null);
              }}
            >
              Edit Preferences
            </button>
          </div>
        )}

        {/* Help & Bookmarks */}
        <button className="dropdown-small-item" onClick={() => toggleContent("help")}>
          <span className="item-icon">❓</span> Help & Support
        </button>

        <button className="dropdown-small-item" onClick={() => toggleContent("bookmarks")}>
          <span className="item-icon">🔖</span> Bookmarks
        </button>

        {/* Notify Button */}
        <button
          className="dropdown-small-item"
          onClick={() => alert("Notify feature coming soon!")}
        >
          <span className="item-icon">🔔</span> Notify
        </button>

        <div className="dropdown-divider"></div>

        {/* Logout */}
        <button
          className="dropdown-small-item item-danger"
          onClick={() => {
            if (window.confirm("Are you sure you want to logout?")) {
              onLogout();
              onClose();
            }
          }}
        >
          <span className="item-icon">🗑️</span> Logout
        </button>

        {/* Inline Help & Bookmarks content */}
        {activeContent && activeContent !== "preferences" && (
          <div style={contentStyle}>
            {activeContent === "help" && (
              <>
                <h4>Help & Support</h4>
                <ul style={{ paddingLeft: "1rem" }}>
                  <li>📄 FAQs</li>
                  <li>📘 Guides</li>
                  <li>📞 Contact Info</li>
                </ul>
              </>
            )}
            {activeContent === "bookmarks" && (
              <>
                <h4>Bookmarks</h4>
                {bookmarks.length > 0 ? (
                  <ul style={{ paddingLeft: "1rem" }}>
                    {bookmarks.map((item, index) => (
                      <li key={index}>🔖 {item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No bookmarks yet.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
