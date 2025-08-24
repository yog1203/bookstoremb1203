// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { api } from '../lib/api'

// export default function Login(){
//   const [email,setEmail] = useState('')
//   const [password,setPassword] = useState('')
//   const [err,setErr] = useState('')
//   const nav = useNavigate()
//   async function submit(e){ e.preventDefault(); setErr('')
//     try{ const d = await api('/api/auth/login', { method:'POST', body:{ email, password } })
//       localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); nav('/app')
//     }catch(e){ setErr(e.message) } }
//   return (
//     <div className="container">
//       <div className="card section" style={{ maxWidth: 420, margin: '80px auto' }}>
//         <div className="header"><div className="brand"><span className="brand-badge" /> Sign in</div></div>
//         <form className="form" onSubmit={submit}>
//           <div><label>Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
//           <div><label>Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
//           {err && <div style={{ color:'#dc2626' }}>{err}</div>}
//           <button className="btn primary" type="submit">Login</button>
//         </form>
//       </div>
//     </div>
//   )
// }

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");   // ✅ defines email
  const [password, setPassword] = useState(""); // ✅ defines password
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }), // ✅ values come from state
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      nav("/app");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="container">
      <div className="card section" style={{ maxWidth: 420, margin: "80px auto" }}>
        <div className="header">
          <div className="brand">
            <span className="brand-badge" /> Sign in
          </div>
        </div>
        <form className="form" onSubmit={submit}>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}              // ✅ bound to state
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}          // ✅ bound to state
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err && <div style={{ color: "red" }}>{err}</div>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

