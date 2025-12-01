import React, { useState } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import Filters from '../Filters/Filters';
import FeatureCarousel from '../FeatureCarousel/FeatureCarousel';
import RestaurantCard from '../RestaurantCard/RestaurantCard';
import RestaurantDetails from '../RestaurantDetails/RestaurantDetails';
import './RestaurantList.css';

function RestaurantList({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null); // null = list view, restaurant object = detail view
  
  // Sample data
  const restaurants = [
    { id: 1, name: "Chicken Unlimited", cuisine: "Fast Food", status: "green", crowdLevel: "Low", occupancy: 45, waitTime: 5, isFeatured: true, address: "123 Main St", phone: "(555) 123-4567", hours: "9AM-10PM" },
    { id: 2, name: "Ahmad Brother's Cafe", cuisine: "Cafe", status: "yellow", crowdLevel: "Moderate", occupancy: 72, waitTime: 15, isFeatured: true, address: "456 Oak Ave", phone: "(555) 987-6543", hours: "7AM-9PM" },
  ];

  const featuredRestaurants = restaurants.filter(restaurant => restaurant.isFeatured);

  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleBackToList = () => {
    setSelectedRestaurant(null);
  };

  // If a restaurant is selected, show details page. Otherwise show list.
  return (
    <div className="restaurant-list">
      {/* Header - ALWAYS VISIBLE */}
      <div className="restaurant-list-header">
        {/* Back button when in detail view */}
        {selectedRestaurant && (
          <button className="back-button" onClick={handleBackToList}>
            ← Back
          </button>
        )}
        
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <Filters 
          filters={filters}
          setFilters={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
        <button className="menu-button">☰</button>
      </div>

      {/* Show either Restaurant Details or Restaurant List */}
      {selectedRestaurant ? (
        <RestaurantDetails 
          restaurant={selectedRestaurant}
          onBack={handleBackToList}
        />
      ) : (
        <>
          {/* Featured Carousel */}
          <FeatureCarousel restaurants={featuredRestaurants} />

          {/* Restaurant List */}
          <div className="restaurants-container">
            <h2>Nearby Restaurants</h2>
            <p>Found {restaurants.length} restaurants</p>
            
            {restaurants.map(restaurant => (
              <RestaurantCard 
                key={restaurant.id} 
                restaurant={restaurant}
                onRestaurantClick={handleRestaurantClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RestaurantList;