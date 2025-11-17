import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Authentication data
let users = [
  {
    id: 1,
    email: "user@example.com",
    password: "password123",
    name: "John Doe",
    type: "diner"
  },
  {
    id: 2,
    email: "admin@eatease.com",
    password: "admin123",
    name: "Restaurant Admin",
    type: "admin"
  }
];

let sessions = [];

let restaurants = [
  { 
    id: 1, 
    name: "UC Canteen", 
    cuisine: "Filipino",
    status: "green", 
    crowdLevel: "Low",
    occupancy: 35,
    waitTime: 5,
    lastUpdated: new Date().toISOString(),
    hasPromo: true
  },
  { 
    id: 2, 
    name: "SM Diner", 
    cuisine: "International",
    status: "yellow", 
    crowdLevel: "Moderate",
    occupancy: 65,
    waitTime: 15,
    lastUpdated: new Date().toISOString(),
    hasPromo: false
  },
  { 
    id: 3, 
    name: "Baguio Eats", 
    cuisine: "Local Delicacies",
    status: "red", 
    crowdLevel: "High",
    occupancy: 90,
    waitTime: 30,
    lastUpdated: new Date().toISOString(),
    hasPromo: true
  }
];

let promotions = [
  {
    id: 1,
    restaurantId: 1,
    title: "Lunch Special",
    description: "20% off all lunch items from 11AM-2PM",
    discount: 20,
    validUntil: "2024-12-31",
    isActive: true
  },
  {
    id: 2,
    restaurantId: 3,
    title: "Weekend Feast",
    description: "Buy 1 get 1 free on selected dishes",
    discount: 50,
    validUntil: "2024-12-25",
    isActive: true
  }
];

// Authentication endpoints
app.post("/api/auth/signup", (req, res) => {
  const { email, password, name, userType } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = {
    id: users.length + 1,
    email,
    password,
    name,
    type: userType || "diner"
  };

  users.push(newUser);

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions.push({ token, userId: newUser.id });

  res.json({
    message: "User created successfully",
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      type: newUser.type
    },
    token
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions.push({ token, userId: user.id });

  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type
    },
    token
  });
});

app.post("/api/auth/logout", (req, res) => {
  const { token } = req.body;
  const sessionIndex = sessions.findIndex(s => s.token === token);
  
  if (sessionIndex !== -1) {
    sessions.splice(sessionIndex, 1);
  }
  
  res.json({ message: "Logout successful" });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const session = sessions.find(s => s.token === token);
  if (!session) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type
    }
  });
});

// Restaurant endpoints
app.get("/", (req, res) => {
  res.send("✅ EatEase API is running successfully!");
});

app.get("/api/restaurants", (req, res) => {
  res.json(restaurants);
});

app.post("/api/restaurants/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, crowdLevel } = req.body;

  const restaurant = restaurants.find((r) => r.id === parseInt(id));
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  restaurant.status = status;
  restaurant.crowdLevel = crowdLevel;
  res.json({ message: "✅ Status updated successfully", restaurant });
});

app.get("/api/restaurants/:id/occupancy", (req, res) => {
  const { id } = req.params;
  const restaurant = restaurants.find(r => r.id === parseInt(id));
  
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  const simulatedOccupancy = Math.floor(Math.random() * 100);
  const simulatedWaitTime = Math.floor(simulatedOccupancy / 3);
  
  restaurant.occupancy = simulatedOccupancy;
  restaurant.waitTime = simulatedWaitTime;
  restaurant.lastUpdated = new Date().toISOString();
  
  if (simulatedOccupancy < 40) {
    restaurant.status = "green";
    restaurant.crowdLevel = "Low";
  } else if (simulatedOccupancy < 75) {
    restaurant.status = "yellow";
    restaurant.crowdLevel = "Moderate";
  } else {
    restaurant.status = "red";
    restaurant.crowdLevel = "High";
  }

  res.json(restaurant);
});

app.post("/api/restaurants/iot-update", (req, res) => {
  restaurants.forEach(restaurant => {
    const simulatedOccupancy = Math.floor(Math.random() * 100);
    restaurant.occupancy = simulatedOccupancy;
    restaurant.waitTime = Math.floor(simulatedOccupancy / 3);
    restaurant.lastUpdated = new Date().toISOString();
    
    if (simulatedOccupancy < 40) {
      restaurant.status = "green";
      restaurant.crowdLevel = "Low";
    } else if (simulatedOccupancy < 75) {
      restaurant.status = "yellow";
      restaurant.crowdLevel = "Moderate";
    } else {
      restaurant.status = "red";
      restaurant.crowdLevel = "High";
    }
  });
  
  res.json({ message: "✅ IoT data updated for all restaurants", restaurants });
});

// Promotion endpoints
app.get("/api/promotions", (req, res) => {
  const activePromotions = promotions.filter(promo => promo.isActive);
  res.json(activePromotions);
});

app.get("/api/restaurants/:id/promotions", (req, res) => {
  const { id } = req.params;
  const restaurantPromotions = promotions.filter(
    promo => promo.restaurantId === parseInt(id) && promo.isActive
  );
  res.json(restaurantPromotions);
});

app.post("/api/promotions", (req, res) => {
  const { restaurantId, title, description, discount, validUntil } = req.body;
  
  const newPromotion = {
    id: promotions.length + 1,
    restaurantId: parseInt(restaurantId),
    title,
    description,
    discount,
    validUntil,
    isActive: true
  };
  
  promotions.push(newPromotion);
  res.json({ message: "Promotion created successfully", promotion: newPromotion });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});