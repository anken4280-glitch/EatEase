import { BASE_URL } from "./config";

const API_BASE = `${BASE_URL}/api`;

// Mock bookmarks data
const mockBookmarks = [];

// Mock notifications data
const mockNotifications = [];

// Mock data for restaurants - UPDATED WITH NEW FIELDS
const mockRestaurants = [
  {
    id: 1,
    name: "Italian Bistro",
    cuisine: "Italian",
    status: "green",
    crowdLevel: "Low",
    occupancy: 25,
    hasPromo: true,
    rating: 4.5,
    location: "Downtown",
    lastUpdated: new Date().toISOString(),
    verified: true,
    address: "123 Main St, Downtown",
    phone: "(555) 123-4567",
    // NEW FIELDS ADDED
    features: ["Outdoor Seating", "Live Music", "WiFi", "Vegetarian Options"],
    isBookmarked: false
  },
  {
    id: 2,
    name: "Tokyo Sushi",
    cuisine: "Japanese",
    status: "yellow",
    crowdLevel: "Moderate",
    occupancy: 65,
    hasPromo: false,
    rating: 4.2,
    location: "Mall Area",
    lastUpdated: new Date().toISOString(),
    verified: true,
    address: "456 Mall Road",
    phone: "(555) 123-4568",
    // NEW FIELDS ADDED
    features: ["Sushi Bar", "Takeout", "Japanese Cuisine"],
    isBookmarked: false
  },
  {
    id: 3,
    name: "Mexican Fiesta",
    cuisine: "Mexican",
    status: "orange", // CHANGED TO ORANGE
    crowdLevel: "High",
    occupancy: 85,
    hasPromo: true,
    rating: 4.0,
    location: "Downtown",
    lastUpdated: new Date().toISOString(),
    verified: false,
    address: "789 Oak Ave",
    phone: "(555) 123-4569",
    // NEW FIELDS ADDED
    features: ["Spicy Food", "Margaritas", "Family Style"],
    isBookmarked: false
  },
  {
    id: 4,
    name: "Burger Palace",
    cuisine: "American",
    status: "red",
    crowdLevel: "Full",
    occupancy: 95,
    hasPromo: false,
    rating: 3.8,
    location: "Food Court",
    lastUpdated: new Date().toISOString(),
    verified: false,
    address: "321 Food Court Lane",
    phone: "(555) 123-4570",
    // NEW FIELDS ADDED
    features: ["Burgers", "Fast Food", "Takeout"],
    isBookmarked: false
  },
  {
    id: 5,
    name: "Spice Garden",
    cuisine: "Indian",
    status: "green",
    crowdLevel: "Low",
    occupancy: 45,
    hasPromo: true,
    rating: 4.7,
    location: "Mall Area",
    lastUpdated: new Date().toISOString(),
    verified: true,
    address: "654 Spice Road",
    phone: "(555) 123-4571",
    // NEW FIELDS ADDED
    features: ["Vegetarian", "Spicy Food", "Curry Dishes"],
    isBookmarked: false
  }
];

// Mock users for login
const mockUsers = [
  {
    id: 1,
    email: "user@example.com",
    password: "password123",
    name: "John Doe",
    type: "diner"
  },
  {
    id: 2,
    email: "admin@example.com", 
    password: "admin123",
    name: "Restaurant Owner",
    type: "admin"
  },
  {
    id: 3,
    email: "developer@eatease.com", 
    password: "dev123",
    name: "Platform Developer", 
    type: "admin"
  }
];

// Mock reports data
const mockReports = [
  {
    id: 1,
    type: "Inaccurate Information",
    description: "The restaurant hours listed are incorrect. They close at 10 PM, not 11 PM.",
    restaurantId: 3,
    restaurantName: "Mexican Fiesta",
    userId: 1,
    userName: "John Doe",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending"
  },
  {
    id: 2,
    type: "Inappropriate Content",
    description: "There are fake reviews being posted for this restaurant.",
    restaurantId: 4,
    restaurantName: "Burger Palace",
    userId: 1,
    userName: "John Doe",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending"
  },
  {
    id: 3,
    type: "Spam",
    description: "This restaurant appears to be a duplicate listing.",
    restaurantId: 1,
    restaurantName: "Italian Bistro",
    userId: 1,
    userName: "John Doe",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: "pending"
  }
];

// ========== NEW FEATURE FUNCTIONS ==========

// Bookmark functions
export const toggleBookmark = async (restaurantId) => {
  console.log("Mock: Toggling bookmark for", restaurantId);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const restaurant = mockRestaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    restaurant.isBookmarked = !restaurant.isBookmarked;
    
    // Add to mock bookmarks if bookmarked
    if (restaurant.isBookmarked && !mockBookmarks.find(b => b.restaurantId === restaurantId)) {
      mockBookmarks.push({
        id: Date.now(),
        restaurantId: restaurantId,
        restaurantName: restaurant.name,
        addedAt: new Date().toISOString()
      });
    } else if (!restaurant.isBookmarked) {
      const index = mockBookmarks.findIndex(b => b.restaurantId === restaurantId);
      if (index !== -1) {
        mockBookmarks.splice(index, 1);
      }
    }
    
    return { success: true, isBookmarked: restaurant.isBookmarked };
  }
  return { success: false };
};

export const getBookmarks = async () => {
  console.log("Mock: Fetching bookmarks");
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const bookmarkedRestaurants = mockRestaurants.filter(r => r.isBookmarked);
  return bookmarkedRestaurants;
};

// Enhanced status update with orange level - UPDATED FUNCTION
export const updateRestaurantStatus = async (id, status, crowdLevel, occupancy) => {
  console.log("Mock: Updating restaurant status", { id, status, crowdLevel, occupancy });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const restaurant = mockRestaurants.find(r => r.id === id);
  if (restaurant) {
    const oldStatus = restaurant.status;
    restaurant.status = status;
    restaurant.crowdLevel = crowdLevel;
    restaurant.occupancy = occupancy;
    
    // Enhanced wait times based on new status system with orange
    restaurant.waitTime = 
      status === "green" ? 5 : 
      status === "yellow" ? 15 : 
      status === "orange" ? 25 : 35;
    
    restaurant.lastUpdated = new Date().toISOString();
    
    // Create notification if status changed significantly
    if (oldStatus !== status && (oldStatus === "green" || status === "green")) {
      const messages = {
        green: "is now less crowded! 🟢",
        yellow: "is getting busy 🟡",
        orange: "is very crowded 🟠", 
        red: "is at full capacity 🔴"
      };
      
      await createNotification(id, 'status_change', 
        `${restaurant.name} ${messages[status]}`
      );
    }
    
    return { restaurant };
  }
  return null;
};

// Features functions
export const getRestaurantFeatures = async () => {
  console.log("Mock: Fetching restaurant features");
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const allFeatures = mockRestaurants.flatMap(r => r.features || []);
  const uniqueFeatures = [...new Set(allFeatures)];
  return uniqueFeatures;
};

export const updateRestaurantFeatures = async (restaurantId, features) => {
  console.log("Mock: Updating restaurant features", { restaurantId, features });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const restaurant = mockRestaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    restaurant.features = features;
    return { success: true, restaurant };
  }
  return { success: false };
};

// Notification functions
export const createNotification = async (restaurantId, type, message) => {
  console.log("Mock: Creating notification", { restaurantId, type, message });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const restaurant = mockRestaurants.find(r => r.id === restaurantId);
  const newNotification = {
    id: Date.now(),
    restaurantId,
    restaurantName: restaurant?.name || "Unknown Restaurant",
    type,
    message,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  mockNotifications.unshift(newNotification);
  return { success: true, notification: newNotification };
};

export const getNotifications = async () => {
  console.log("Mock: Fetching notifications");
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockNotifications;
};

export const markNotificationAsRead = async (notificationId) => {
  console.log("Mock: Marking notification as read", notificationId);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const notification = mockNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
    return { success: true };
  }
  return { success: false };
};

export const markAllNotificationsAsRead = async () => {
  console.log("Mock: Marking all notifications as read");
  await new Promise(resolve => setTimeout(resolve, 300));
  
  mockNotifications.forEach(notification => {
    notification.isRead = true;
  });
  
  return { success: true };
};

// ========== EXISTING FUNCTIONS (KEEP THESE) ==========

// Mock functions that work without backend
export async function fetchRestaurants() {
  console.log("Using mock restaurants data");
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRestaurants;
}

// Keep the original updateRestaurantStatus for backward compatibility
export async function updateRestaurantStatusLegacy(id, status, crowdLevel) {
  console.log("Mock: Updating restaurant status (legacy)", { id, status, crowdLevel });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const restaurant = mockRestaurants.find(r => r.id === id);
  if (restaurant) {
    restaurant.status = status;
    restaurant.crowdLevel = crowdLevel;
    restaurant.occupancy = status === "green" ? 25 : status === "yellow" ? 65 : 85;
    restaurant.waitTime = status === "green" ? 5 : status === "yellow" ? 15 : 25;
    restaurant.lastUpdated = new Date().toISOString();
    
    return { restaurant };
  }
  return null;
}

export async function simulateIoTUpdate() {
  console.log("Mock: Simulating IoT update");
  await new Promise(resolve => setTimeout(resolve, 300));
  
  mockRestaurants.forEach(restaurant => {
    if (Math.random() > 0.7) {
      const statuses = ["green", "yellow", "orange", "red"]; // UPDATED WITH ORANGE
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      restaurant.status = newStatus;
      restaurant.crowdLevel = 
        newStatus === "green" ? "Low" : 
        newStatus === "yellow" ? "Moderate" : 
        newStatus === "orange" ? "High" : "Full";
      restaurant.occupancy = 
        newStatus === "green" ? 25 : 
        newStatus === "yellow" ? 65 : 
        newStatus === "orange" ? 85 : 95;
      restaurant.waitTime = 
        newStatus === "green" ? 5 : 
        newStatus === "yellow" ? 15 : 
        newStatus === "orange" ? 25 : 35;
      restaurant.lastUpdated = new Date().toISOString();
    }
  });
  
  return { message: "IoT simulation completed" };
}

export async function signupUser(email, password, name, userType) {
  console.log("Mock: Signing up user", { email, name, userType });
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (mockUsers.find(user => user.email === email)) {
    throw new Error("User already exists");
  }
  
  const newUser = {
    id: mockUsers.length + 1,
    email,
    password,
    name,
    type: userType
  };
  
  mockUsers.push(newUser);
  
  return {
    token: "mock_jwt_token_" + Date.now(),
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
      isDeveloperAdmin: false // Default to false for new signups
    }
  };
}

export async function loginUser(email, password) {
  console.log("Mock: Logging in user", { email });
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    throw new Error("Invalid email or password");
  }
  
  // Identify developer admin
  const isDeveloperAdmin = user.email === "developer@eatease.com";
  
  return {
    token: "mock_jwt_token_" + Date.now(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      isDeveloperAdmin: isDeveloperAdmin
    }
  };
}

export async function logoutUser(token) {
  console.log("Mock: Logging out user");
  await new Promise(resolve => setTimeout(resolve, 200));
  return { message: "Logged out successfully" };
}

export async function getCurrentUser(token) {
  console.log("Mock: Getting current user");
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const userData = JSON.parse(storedUser);
    // Preserve developer admin status
    const isDeveloperAdmin = userData.email === "developer@eatease.com";
    return { 
      user: {
        ...userData,
        isDeveloperAdmin: isDeveloperAdmin
      }
    };
  }
  
  return { user: { ...mockUsers[0], isDeveloperAdmin: false } };
}

export async function getRestaurantOccupancy(id) {
  await new Promise(resolve => setTimeout(resolve, 300));
  const restaurant = mockRestaurants.find(r => r.id === id);
  return restaurant ? { occupancy: restaurant.occupancy } : null;
}

// ADMIN FUNCTIONS - Mock implementations
export const verifyRestaurant = async (restaurantId, verified) => {
  console.log("Mock: Verifying restaurant", { restaurantId, verified });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const restaurant = mockRestaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    restaurant.verified = verified;
    restaurant.lastUpdated = new Date().toISOString();
    
    return { 
      success: true, 
      restaurant,
      message: `Restaurant ${verified ? 'verified' : 'unverified'} successfully` 
    };
  }
  
  return { 
    success: false, 
    message: "Restaurant not found" 
  };
};

export const deleteRestaurant = async (restaurantId) => {
  console.log("Mock: Deleting restaurant", { restaurantId });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const index = mockRestaurants.findIndex(r => r.id === restaurantId);
  if (index !== -1) {
    const deletedRestaurant = mockRestaurants.splice(index, 1)[0];
    return { 
      success: true, 
      message: "Restaurant deleted successfully",
      deletedRestaurant 
    };
  }
  
  return { 
    success: false, 
    message: "Restaurant not found" 
  };
};

export const fetchReports = async () => {
  console.log("Mock: Fetching reports");
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const pendingReports = mockReports.filter(report => report.status === "pending");
  return pendingReports;
};

export const resolveReport = async (reportId) => {
  console.log("Mock: Resolving report", { reportId });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const report = mockReports.find(r => r.id === reportId);
  if (report) {
    report.status = "resolved";
    report.resolvedAt = new Date().toISOString();
    
    return { 
      success: true, 
      message: "Report resolved successfully",
      report 
    };
  }
  
  return { 
    success: false, 
    message: "Report not found" 
  };
};

export const createRestaurant = async (restaurantData) => {
  console.log("Mock: Creating restaurant", restaurantData);
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newRestaurant = {
    id: Math.max(...mockRestaurants.map(r => r.id)) + 1,
    ...restaurantData,
    status: "green",
    crowdLevel: "Low",
    occupancy: 25,
    hasPromo: false,
    rating: 0,
    lastUpdated: new Date().toISOString(),
    // NEW FIELDS ADDED
    features: [],
    isBookmarked: false
  };
  
  mockRestaurants.push(newRestaurant);
  
  return { 
    success: true, 
    restaurant: newRestaurant,
    message: "Restaurant created successfully" 
  };
};

export const updateRestaurant = async (restaurantId, updateData) => {
  console.log("Mock: Updating restaurant", { restaurantId, updateData });
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const restaurant = mockRestaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    Object.assign(restaurant, updateData);
    restaurant.lastUpdated = new Date().toISOString();
    
    return { 
      success: true, 
      restaurant,
      message: "Restaurant updated successfully" 
    };
  }
  
  return { 
    success: false, 
    message: "Restaurant not found" 
  };
};

export const addMockReport = async (reportData) => {
  console.log("Mock: Adding report", reportData);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newReport = {
    id: Math.max(...mockReports.map(r => r.id)) + 1,
    ...reportData,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  
  mockReports.push(newReport);
  
  return { 
    success: true, 
    report: newReport,
    message: "Report submitted successfully" 
  };
};