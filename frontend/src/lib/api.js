// // export async function api(path, options = {}){
// //   const { method='GET', body, headers={} } = options
// //   const token = localStorage.getItem('token')
// //   const res = await fetch(path, {
// //     method, headers:{ 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}), ...headers },
// //     body: body ? JSON.stringify(body) : undefined
// //   })
// //   const text = await res.text()
// //   let data = null; if(text){ try{ data = JSON.parse(text) }catch{} }
// //   if(!res.ok || (data && data.ok===false)){ const msg = (data && (data.error||data.message)) || text || `HTTP ${res.status}`; throw new Error(msg) }
// //   return data ?? { ok:true }
// // }

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

// lib/api.js

// export async function api(path, { method = 'GET', body, headers } = {}) {
//   const base = import.meta.env.VITE_API_URL || ''; // e.g. https://your-api.example.com
//   const res = await fetch(base + path, {
//     method,
//     headers: { 'Content-Type': 'application/json', ...(headers || {}) },
//     body: body ? JSON.stringify(body) : undefined,
//     credentials: 'include',
//   });

//   const contentType = res.headers.get('content-type') || '';
//   const text = await res.text(); // read once

//   // Only parse JSON if it actually *is* JSON and not empty
//   let data;
//   if (contentType.includes('application/json') && text) {
//     try { data = JSON.parse(text); }
//     catch { throw new Error('Invalid JSON from server'); }
//   } else {
//     // Return the text you actually got (301 HTML, proxy page, empty body, etc.)
//     throw new Error(`Expected JSON (${res.status}), got: ${text.slice(0, 180) || '(empty body)'}`);
//   }

//   if (!res.ok) {
//     throw new Error(data?.error || `HTTP ${res.status}`);
//   }
//   return data;
// }

// lib/api.js
export async function api(path, { method='GET', body, headers } = {}) {
  const base = import.meta.env.VITE_API_URL || '';
// frontend api helper
const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// export async function api(path, { method = 'GET', body, headers } = {}) {
//   const base = import.meta.env.VITE_API_URL || ''; // e.g. https://your-api.example.com
//   const res = await fetch(base + path, {
//     method,
//     headers: { 'Content-Type': 'application/json', ...(headers || {}) },
//   });
  

  
  // const res = await fetch(base + path, {
  //   method,
  //   headers: { 'Content-Type': 'application/json', ...(headers||{}) },
  //   body: body ? JSON.stringify(body) : undefined,
  //   // credentials: 'include',  // ❌ remove unless you use cookies
  // });

  const ct = res.headers.get('content-type') || '';
  const txt = await res.text();
  const data = ct.includes('application/json') && txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}



