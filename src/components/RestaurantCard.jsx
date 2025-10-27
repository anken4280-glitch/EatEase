import React from "react";

const statusLabel = {
  green: "Low",
  yellow: "Moderate",
  red: "High"
};

export default function RestaurantCard({ r }){
  return (
    <div className="card">
      <div className="card-left">
        <h3>{r.name}</h3>
        <p className="muted">{r.cuisine} • {r.open ? "Open" : "Closed"}</p>
      </div>

      <div className="card-right">
        <div className="traffic-light" aria-hidden>
          <span className={`light ${r.crowd_status === 'green' ? 'on' : ''} green`}></span>
          <span className={`light ${r.crowd_status === 'yellow' ? 'on' : ''} yellow`}></span>
          <span className={`light ${r.crowd_status === 'red' ? 'on' : ''} red`}></span>
        </div>
        <div className="status-text">{statusLabel[r.crowd_status] || 'Unknown'}</div>
      </div>
    </div>
  );
}
