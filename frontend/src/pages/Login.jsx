import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";   // <--- your helper file

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");

    try {
      // 🔑 This is where your line goes
      const d = await api("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      localStorage.setItem("token", d.token);
      localStorage.setItem("user", JSON.stringify(d.user));
      nav("/app");
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="container">
      <div className="card section" style={{ maxWidth: 420, margin: '80px auto' }}>
        <div className="header"><div className="brand"><span className="brand-badge" /> Sign in</div></div>
        <form className="form" onSubmit={submit}>
          <div><label>Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div><label>Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
          {err && <div style={{ color:'#dc2626' }}>{err}</div>}
          <button className="btn primary" type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}


