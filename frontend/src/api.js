import { BASE_URL } from "./config";

const API_BASE = `${BASE_URL}/api`;

// Mock data for restaurants
export const mockRestaurants = [
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
    location: "Downtown",
    openHours: "10:00 AM - 10:00 PM",
    contactNumber: "09123456789",
    maxTables: 15,
    overview: "Cozy Italian restaurant with homemade pasta.",
    menu: "Pasta, Pizza, Salads",
    photos: ["url1.jpg", "url2.jpg"],
    profilePic: "profile1.jpg",
    coverPhoto: "cover1.jpg",
    direction: "https://maps.google.com/?q=Italian+Bistro",
    priceRange: "₱200-₱500",
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
    location: "Mall Area",
    openHours: "11:00 AM - 10:00 PM",
    contactNumber: "09198765432",
    maxTables: 20,
    overview: "Fresh sushi and traditional Japanese dishes.",
    menu: "Sushi, Ramen, Tempura",
    photos: ["sushi1.jpg", "sushi2.jpg"],
    profilePic: "profile2.jpg",
    coverPhoto: "cover2.jpg",
    direction: "https://maps.google.com/?q=Tokyo+Sushi",
    priceRange: "₱300-₱700",
    lastUpdated: new Date().toISOString()
  }
];

// Mock users for login
const mockUsers = [
  { id: 1, email: "user@example.com", password: "password123", name: "John Doe", type: "diner" },
  { id: 2, email: "owner@example.com", password: "owner123", name: "Restaurant Owner", type: "restaurant_owner" },
  { id: 3, email: "admin@example.com", password: "admin123", name: "System Admin", type: "admin" }
];

// Fetch all restaurants
export async function fetchRestaurants() {
  console.log("Using mock restaurants data");
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRestaurants;
}

// Update restaurant status and crowd level
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

// Update full restaurant details (for restaurant owners)
export async function updateRestaurant(id, data) {
  console.log("Mock: Updating restaurant details", { id, data });
  await new Promise(resolve => setTimeout(resolve, 300));

  const restaurant = mockRestaurants.find(r => r.id === id);
  if (restaurant) {
    Object.keys(data).forEach(key => {
      restaurant[key] = data[key];
    });
    restaurant.lastUpdated = new Date().toISOString();
    return { restaurant };
  }
  return null;
}

// Simulate IoT updates to restaurant crowd
export async function simulateIoTUpdate() {
  console.log("Mock: Simulating IoT update");
  await new Promise(resolve => setTimeout(resolve, 300));

  mockRestaurants.forEach(restaurant => {
    if (Math.random() > 0.7) {
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

// User signup
export async function signupUser(email, password, name, userType) {
  console.log("Mock: Signing up user", { email, name, userType });
  await new Promise(resolve => setTimeout(resolve, 500));

  if (mockUsers.find(user => user.email === email)) throw new Error("User already exists");

  const newUser = { id: mockUsers.length + 1, email, password, name, type: userType };
  mockUsers.push(newUser);

  return { token: "mock_jwt_token_" + Date.now(), user: newUser };
}

// User login
export async function loginUser(email, password) {
  console.log("Mock: Logging in user", { email });
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password");

  return { token: "mock_jwt_token_" + Date.now(), user };
}

// User logout
export async function logoutUser(token) {
  console.log("Mock: Logging out user");
  await new Promise(resolve => setTimeout(resolve, 200));
  return { message: "Logged out successfully" };
}

// Get current user
export async function getCurrentUser(token) {
  console.log("Mock: Getting current user");
  await new Promise(resolve => setTimeout(resolve, 300));

  const storedUser = localStorage.getItem("user");
  if (storedUser) return { user: JSON.parse(storedUser) };

  return { user: mockUsers[0] };
}

// Get restaurant occupancy
export async function getRestaurantOccupancy(id) {
  await new Promise(resolve => setTimeout(resolve, 300));
  const restaurant = mockRestaurants.find(r => r.id === id);
  return restaurant ? { occupancy: restaurant.occupancy } : null;
}
