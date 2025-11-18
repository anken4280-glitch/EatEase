import { BASE_URL } from "./config";

const API_BASE = `${BASE_URL}/api`;

// Mock data for restaurants
const mockRestaurants = [
  {
    id: 1,
    name: "Italian Bistro",
    cuisine: "Italian",
    status: "green",
    crowdLevel: "Low",
    occupancy: 25,
    waitTime: 5,
    hasPromo: true,
    rating: 4.5,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    name: "Tokyo Sushi",
    cuisine: "Japanese",
    status: "yellow",
    crowdLevel: "Moderate",
    occupancy: 65,
    waitTime: 15,
    hasPromo: false,
    rating: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    name: "Mexican Fiesta",
    cuisine: "Mexican",
    status: "red",
    crowdLevel: "High",
    occupancy: 85,
    waitTime: 25,
    hasPromo: true,
    rating: 4.0,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 4,
    name: "Burger Palace",
    cuisine: "American",
    status: "green",
    crowdLevel: "Low",
    occupancy: 30,
    waitTime: 8,
    hasPromo: false,
    rating: 3.8,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 5,
    name: "Spice Garden",
    cuisine: "Indian",
    status: "yellow",
    crowdLevel: "Moderate",
    occupancy: 55,
    waitTime: 12,
    hasPromo: true,
    rating: 4.7,
    lastUpdated: new Date().toISOString()
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
  }
];

// Mock functions that work without backend
export async function fetchRestaurants() {
  console.log("Using mock restaurants data");
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRestaurants;
}

export async function updateRestaurantStatus(id, status, crowdLevel) {
  console.log("Mock: Updating restaurant status", { id, status, crowdLevel });
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
  
  // Randomly update some restaurants
  mockRestaurants.forEach(restaurant => {
    if (Math.random() > 0.7) { // 30% chance to update
      const statuses = ["green", "yellow", "red"];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      restaurant.status = newStatus;
      restaurant.crowdLevel = newStatus === "green" ? "Low" : newStatus === "yellow" ? "Moderate" : "High";
      restaurant.occupancy = newStatus === "green" ? 25 : newStatus === "yellow" ? 65 : 85;
      restaurant.waitTime = newStatus === "green" ? 5 : newStatus === "yellow" ? 15 : 25;
      restaurant.lastUpdated = new Date().toISOString();
    }
  });
  
  return { message: "IoT simulation completed" };
}

export async function signupUser(email, password, name, userType) {
  console.log("Mock: Signing up user", { email, name, userType });
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if user already exists
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
      type: newUser.type
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
  
  return {
    token: "mock_jwt_token_" + Date.now(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type
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
  
  // In a real app, we'd decode the JWT token to get user info
  // For mock purposes, return the first user or check localStorage
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    return { user: JSON.parse(storedUser) };
  }
  
  return { user: mockUsers[0] };
}

// Other API functions with mock implementations
export async function getRestaurantOccupancy(id) {
  await new Promise(resolve => setTimeout(resolve, 300));
  const restaurant = mockRestaurants.find(r => r.id === id);
  return restaurant ? { occupancy: restaurant.occupancy } : null;
}