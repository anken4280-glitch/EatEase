const API_BASE = "http://localhost:4000";

export async function fetchRestaurants() {
  try {
    const response = await fetch(`${API_BASE}/api/restaurants`);
    if (!response.ok) throw new Error("Failed to fetch restaurants");
    return await response.json();
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
}

export async function updateRestaurantStatus(id, status, crowdLevel) {
  try {
    const response = await fetch(`${API_BASE}/api/restaurants/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, crowdLevel }),
    });

    if (!response.ok) throw new Error("Failed to update restaurant status");
    return await response.json();
  } catch (error) {
    console.error("Error updating status:", error);
    return null;
  }
}
