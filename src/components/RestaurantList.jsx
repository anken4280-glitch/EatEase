import React, { useEffect, useState, useRef } from "react";
import { api } from "../api";
import Filters from "./Filters";
import RestaurantCard from "./RestaurantCard";
import { WS_URL } from "../config";

export default function RestaurantList(){
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cuisine: "all", openNow: false });
  const wsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getRestaurants()
      .then(data => { if(mounted) setRestaurants(data); })
      .catch(err => {
        console.warn("API error, using mock data:", err);
        if(mounted) setRestaurants(mockData());
      })
      .finally(()=> mounted && setLoading(false));

    // WebSocket for live updates
    try {
      const ws = new WebSocket(WS_URL);
      ws.onopen = ()=> console.log("ws open");
      ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          // Expected format: { id, crowd_status }
          if(parsed.id && parsed.crowd_status){
            setRestaurants(prev => prev.map(r => r.id === parsed.id ? { ...r, crowd_status: parsed.crowd_status } : r));
          }
        } catch(e){ console.error(e); }
      };
      ws.onerror = console.error;
      wsRef.current = ws;
    } catch(e){ console.log("No WS", e); }

    return () => { mounted = false; if(wsRef.current) wsRef.current.close(); };
  }, []);

  const filtered = restaurants.filter(r => {
    if(filters.cuisine !== "all" && r.cuisine !== filters.cuisine) return false;
    if(filters.openNow && !r.open) return false;
    return true;
  });

  return (
    <div className="container">
      <h2>Nearby Restaurants</h2>
      <Filters filters={filters} setFilters={setFilters} restaurants={restaurants} />
      {loading ? <p>Loading...</p> :
        <div className="grid">
        {filtered.length === 0 ? <p>No restaurants match filters.</p> :
          filtered.map(r => <RestaurantCard key={r.id} r={r} />)
        }
        </div>
      }
    </div>
  );
}

function mockData(){
  return [
    { id: "r1", name: "Café Cordillera", cuisine: "Filipino", crowd_status: "green", open: true },
    { id: "r2", name: "Sizzling Sisig House", cuisine: "Filipino", crowd_status: "yellow", open: false },
    { id: "r3", name: "Green Bowl", cuisine: "Healthy", crowd_status: "red", open: true },
  ];
}
