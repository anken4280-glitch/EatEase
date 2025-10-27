import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard(){
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if(!token) { nav("/admin"); return; }
    api.getRestaurants()
      .then(setRestaurants)
      .catch(err => {
        console.warn("Failed to load, using mock data", err);
        setRestaurants([
          { id: "r1", name: "Café Cordillera", crowd_status: "green" },
          { id: "r2", name: "Green Bowl", crowd_status: "red" },
        ]);
      })
      .finally(()=> setLoading(false));
  }, []);

  async function changeStatus(id, status){
    try {
      await api.setRestaurantStatus(id, status);
      setRestaurants(prev => prev.map(r => r.id === id ? {...r, crowd_status: status} : r));
    } catch(e) {
      console.error(e);
      alert("Failed to update on server. (Check console). For demo, UI updated locally.");
      setRestaurants(prev => prev.map(r => r.id === id ? {...r, crowd_status: status} : r));
    }
  }

  function logout(){
    localStorage.removeItem("admin_token");
    nav("/admin");
  }

  return (
    <div className="container">
      <div className="admin-top">
        <h2>Admin Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </div>

      {loading ? <p>Loading...</p> :
        <div>
          {restaurants.map(r => (
            <div key={r.id} className="admin-row">
              <div><strong>{r.name}</strong> — status: {r.crowd_status}</div>
              <div className="admin-actions">
                <button onClick={() => changeStatus(r.id, "green")}>Set Green</button>
                <button onClick={() => changeStatus(r.id, "yellow")}>Set Yellow</button>
                <button onClick={() => changeStatus(r.id, "red")}>Set Red</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
