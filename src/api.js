import { BASE_URL } from "./config";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const token = localStorage.getItem("admin_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const resp = await fetch(url, { ...options, headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${resp.status} ${text}`);
  }
  return resp.json();
}

export const api = {
  getRestaurants: () => request("/api/restaurants"),
  setRestaurantStatus: (id, status) =>
    request(`/api/restaurants/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  adminLogin: (user, pass) =>
    request(`/api/admin/login`, {
      method: "POST",
      body: JSON.stringify({ username: user, password: pass }),
    }),
};
