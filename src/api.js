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

export async function simulateIoTUpdate() {
  try {
    const response = await fetch(`${API_BASE}/api/restaurants/iot-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to simulate IoT update");
    return await response.json();
  } catch (error) {
    console.error("Error simulating IoT update:", error);
    return null;
  }
}

export async function getRestaurantOccupancy(id) {
  try {
    const response = await fetch(`${API_BASE}/api/restaurants/${id}/occupancy`);
    if (!response.ok) throw new Error("Failed to fetch occupancy data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching occupancy:", error);
    return null;
  }
}

export async function signupUser(email, password, name, userType) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, userType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

export async function logoutUser(token) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

export async function getCurrentUser(token) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) throw new Error("Failed to get user data");
    return await response.json();
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}