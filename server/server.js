import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// 🟩 Fake restaurant data (temporary storage)
let restaurants = [
  { id: 1, name: "UC Canteen", status: "green", crowdLevel: "Low" },
  { id: 2, name: "SM Diner", status: "yellow", crowdLevel: "Moderate" },
  { id: 3, name: "Baguio Eats", status: "red", crowdLevel: "High" },
];

// Default route
app.get("/", (req, res) => {
  res.send("✅ EatEase API is running successfully!");
});

// 🟨 Get all restaurants
app.get("/api/restaurants", (req, res) => {
  res.json(restaurants);
});

// 🟥 Update a restaurant’s crowd status
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
