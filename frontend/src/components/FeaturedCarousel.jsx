import React, { useState, useEffect, useRef } from "react";
import "../styles/carousel.css";

export default function FeaturedCarousel({ featuredRestaurants }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideInterval = useRef(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredRestaurants.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + featuredRestaurants.length) % featuredRestaurants.length
    );
  };

  useEffect(() => {
    slideInterval.current = setInterval(nextSlide, 5000); // auto-slide every 5s
    return () => clearInterval(slideInterval.current);
  }, [featuredRestaurants]);

  return (
    <div className="carousel-container">
      {featuredRestaurants.map((item, index) => (
        <div
          key={index}
          className={`carousel-slide ${index === currentIndex ? "active" : ""}`}
          style={{ backgroundImage: `url(${item.image})` }}
        >
          <div className="carousel-content">
            <h2>{item.name}</h2>
            <p>{item.description}</p>
          </div>
        </div>
      ))}

      {/* Arrow buttons in the same horizontal line at the bottom */}
      <div className="carousel-btn-container">
        <button className="carousel-btn prev" onClick={prevSlide}>
          &#10094;
        </button>
        <button className="carousel-btn next" onClick={nextSlide}>
          &#10095;
        </button>
      </div>

      {/* Indicators */}
      <div className="carousel-indicators">
        {featuredRestaurants.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
