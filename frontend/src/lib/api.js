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

const BASE = import.meta.env.VITE_API_BASE || '';  // <-- read from env

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : BASE + path;
  const { method='GET', body, headers={} } = options;
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null; if (text) { try { data = JSON.parse(text); } catch {} }
  if (!res.ok || (data && data.ok === false)) {
    const msg = (data && (data.error || data.message)) || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data ?? { ok:true };
}

