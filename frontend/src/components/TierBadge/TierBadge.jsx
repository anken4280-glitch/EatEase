import React, { useState, useEffect, useRef } from "react";
import "./TierBadge.css";

const TierBadge = ({ 
  restaurantId, 
  ownerView = false,
  restaurantData = null
}) => {
  const [tier, setTier] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const badgeRef = useRef(null);
  const tooltipRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        badgeRef.current && 
        !badgeRef.current.contains(event.target) &&
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target)
      ) {
        setShowTooltip(false);
      }
    };

    // Only add listener if tooltip is shown
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTooltip]);

  useEffect(() => {
    if (restaurantData && restaurantData.subscription_tier) {
      setTier(restaurantData.subscription_tier);
    } else if (restaurantId && ownerView) {
      fetchTier();
    }
  }, [restaurantId, ownerView, restaurantData]);

  const fetchTier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        "http://localhost:8000/api/subscription/tier",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTier(data.tier);
      }
    } catch (error) {
      console.error("Error fetching tier:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTooltipText = () => {
    return tier === "premium" 
      ? "Automated Crowd Counting" 
      : "Manual Updates - Crowd status might be outdated";
  };

  const handleBadgeClick = () => {
    if (isMobile) {
      // On mobile, toggle tooltip on click
      setShowTooltip(!showTooltip);
    } else {
      // On desktop, just show on hover (already handled by CSS)
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowTooltip(false);
    }
  };

  if (loading) {
    return <span className="tier-badge loading">...</span>;
  }

  return (
    <div className="tier-badge-wrapper" ref={badgeRef}>
      <button
        className={`card-tier-badge ${tier}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleBadgeClick}
        aria-label={getTooltipText()}
      >
        {tier === "premium" ? (
          <>
            <span className="tier-text">Premium</span>
          </>
        ) : (
          <>
            <span className="tier-text">Basic</span>
          </>
        )}
      </button>
      
      {showTooltip && (
        <>
          {/* Click-outside overlay for mobile */}
          {isMobile && (
            <div 
              className="tooltip-overlay active"
              onClick={() => setShowTooltip(false)}
            />
          )}
          
          {/* Tooltip */}
          <div 
            className="tier-tooltip" 
            ref={tooltipRef}
            onClick={(e) => e.stopPropagation()}
          >
            {getTooltipText()}
          </div>
        </>
      )}
    </div>
  );
};

export default TierBadge;