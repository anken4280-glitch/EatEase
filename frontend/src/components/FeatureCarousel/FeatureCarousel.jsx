import React, { useState, useEffect, useRef } from "react";
import "./FeatureCarousel.css";

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);

  // Mock featured events
  const features = [
    {
      id: 1,
      title: "Weekend Special - 50% Off",
      description: "Enjoy 50% off on all main courses every weekend!",
      discount: "50% OFF",
      restaurant: "Pizza Palace",
      image: "🍕",
      backgroundColor: "#FF6B6B",
    },
    {
      id: 2,
      title: "Happy Hour",
      description: "Buy one get one free on all drinks from 5 PM to 7 PM",
      discount: "BOGO FREE",
      restaurant: "Burger Corner",
      image: "🍔",
      backgroundColor: "#4ECDC4",
    },
    {
      id: 3,
      title: "Family Feast",
      description: "Special family combo with 4 meals and drinks",
      discount: "30% OFF",
      restaurant: "Sushi Garden",
      image: "🍣",
      backgroundColor: "#45B7D1",
    },
    {
      id: 4,
      title: "Weekday Lunch Special",
      description: "Quick lunch deals from 12 PM to 2 PM",
      discount: "25% OFF",
      restaurant: "Taco Fiesta",
      image: "🌮",
      backgroundColor: "#96CEB4",
    },
    {
      id: 5,
      title: "Dessert Night",
      description: "Free dessert with any main course order",
      discount: "FREE DESSERT",
      restaurant: "Pasta Paradise",
      image: "🍰",
      backgroundColor: "#FFEAA7",
    },
  ];

  // Auto-rotate carousel
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Scroll to current slide
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const scrollContainer = scrollContainerRef.current;
    const slides = scrollContainer.querySelectorAll(".carousel-slide");
    if (slides.length > 0) {
      const cardWidth = slides[0].offsetWidth;
      scrollContainer.scrollTo({
        left: cardWidth * currentIndex,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const goToPrevious = () => {
    const newIndex =
      currentIndex === 0 ? features.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const newIndex =
      currentIndex === features.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const slides =
      scrollContainerRef.current.querySelectorAll(".carousel-slide");
    if (slides.length > 0) {
      const cardWidth = slides[0].offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex !== currentIndex) setCurrentIndex(newIndex);
    }
  };

  return (
    <div className="feature-carousel">
      <div className="carousel-container">
        <div
          className="carousel-scroll-container"
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="carousel-track">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`carousel-slide ${
                  index === currentIndex ? "active" : ""
                }`}
                style={{ backgroundColor: feature.backgroundColor }}
              >
                <div className="slide-content">
                  <div className="slide-icon">{feature.image}</div>
                  <div className="slide-text">
                    <span className="discount-badge">{feature.discount}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <div className="slide-meta">
                      <span className="restaurant">
                        🏪 {feature.restaurant}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="carousel-dots">
        {features.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
