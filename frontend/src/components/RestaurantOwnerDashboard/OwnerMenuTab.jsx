import React, { useState, useEffect } from "react";
import "./OwnerMenuTab.css";

const OwnerMenuTab = ({ restaurantId }) => {
  const [menuDescription, setMenuDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Load existing menu
  useEffect(() => {
    fetchMenu();
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurants/${restaurantId}/menu-text`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      const data = await response.json();

      if (data.success) {
        setMenuDescription(data.menu_description || data.menu_text || "");
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    }
  };

  const saveMenu = async () => {
    setIsSaving(true);
    setMessage("");

    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(
        `http://localhost/EatEase/backend/public/api/restaurants/${restaurantId}/menu-text`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ menu_description: menuDescription }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setMessage("Saved successfully!");
        setIsEditing(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save menu");
      }
    } catch (error) {
      console.error("Error saving menu:", error);
      setMessage("Error saving menu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="owner-menu-tab">
      <div className="menu-header">
        <div className="menu-actions">
          <h3>Restaurant Menu</h3>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="White"
              >
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
              </svg>
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={saveMenu}
                disabled={isSaving}
                className="save-btn"
              >
                {isSaving ? "Wait" : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchMenu(); // Reload original text
                }}
                className="menu-cancel-btn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="#000000"
                  viewBox="0 0 256 256"
                >
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`message ${message.includes("") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <div className="menu-content">
        {isEditing ? (
          <textarea
            value={menuDescription}
            onChange={(e) => setMenuDescription(e.target.value)}
            placeholder="Enter"
            rows="15"
            className="menu-textarea"
            autoFocus
          />
        ) : (
          <div className="menu-display">
            {menuDescription ? (
              <div className="menu-text-display">
                <pre className="menu-text">{menuDescription}</pre>
              </div>
            ) : (
              <div className="empty-menu"></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerMenuTab;
