import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Test server is running!");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Test endpoint works!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
});