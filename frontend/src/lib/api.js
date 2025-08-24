// export async function api(path, options = {}){
//   const { method='GET', body, headers={} } = options
//   const token = localStorage.getItem('token')
//   const res = await fetch(path, {
//     method, headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}), ...headers },
//     body: body ? JSON.stringify(body) : undefined
//   })
//   const text = await res.text()
//   let data = null; if(text){ try{ data = JSON.parse(text) }catch{} }
//   if(!res.ok || (data && data.ok===false)){ const msg = (data && (data.error||data.message)) || text || `HTTP ${res.status}`; throw new Error(msg) }
//   return data ?? { ok:true }
// }

// const BASE = import.meta.env.VITE_API_BASE || '';  // <-- read from env

// export async function api(path, options = {}) {
//   const url = path.startsWith('http') ? path : BASE + path;
//   const { method='GET', body, headers={} } = options;
//   const token = localStorage.getItem('token');
//   const res = await fetch(url, {
//     method,
//     headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}), ...headers },
//     body: body ? JSON.stringify(body) : undefined
//   });
//   const text = await res.text();
//   let data = null; if (text) { try { data = JSON.parse(text); } catch {} }
//   if (!res.ok || (data && data.ok === false)) {
//     const msg = (data && (data.error || data.message)) || text || `HTTP ${res.status}`;
//     throw new Error(msg);
//   }
//   return data ?? { ok:true };
// }

// src/lib/api.js  (CRA / non-Vite)
// const API = process.env.REACT_APP_API_URL || ''; // e.g. https://your-api.onrender.com

// export async function api(path, init = {}) {
//   const res = await fetch(API + path, {
//     headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
//     ...init,
//     body: init.body ? JSON.stringify(init.body) : undefined
//   });

//   const ct = res.headers.get('content-type') || '';
//   const text = await res.text();

//   if (!res.ok) {
//     try {
//       const j = text ? JSON.parse(text) : null;
//       throw new Error((j && (j.error || j.message)) || text || `HTTP ${res.status}`);
//     } catch {
//       throw new Error(text || `HTTP ${res.status}`);
//     }
//   }

//   if (ct.includes('application/json')) return text ? JSON.parse(text) : null;
//   return text || null;
// }
// src/lib/api.js  (Vite)
const API = import.meta.env.VITE_API_URL; // e.g. https://your-api.onrender.com

export async function api(path, init = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
    body: init.body ? JSON.stringify(init.body) : undefined
  });

  const ct = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!res.ok) {
    try {
      const j = text ? JSON.parse(text) : null;
      throw new Error((j && (j.error || j.message)) || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  if (ct.includes('application/json')) return text ? JSON.parse(text) : null;
  return text || null;
}



