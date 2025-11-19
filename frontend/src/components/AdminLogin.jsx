import React, { useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminLogin(){
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();
    setErr("");
    try {
      const res = await api.adminLogin(user, pass);
      // backend should return { token }
      localStorage.setItem("admin_token", res.token);
      nav("/admin/dashboard");
    } catch(e){
      console.error(e);
      setErr("Login failed (check console). Use mock login: admin/admin to continue.");
      // for demo enable mock token
      if(user === "admin" && pass === "admin"){
        localStorage.setItem("admin_token", "MOCK_TOKEN");
        nav("/admin/dashboard");
      }
    }
  }

  return (
    <div className="container narrow">
      <h2>Restaurant Admin Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>Username
          <input value={user} onChange={e=>setUser(e.target.value)} />
        </label>
        <label>Password
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        </label>
        {err && <p className="error">{err}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
