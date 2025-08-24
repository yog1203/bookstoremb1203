// src/lib/api.js
export async function api(path, { method = "GET", body, headers } = {}) {
  const base = import.meta.env.VITE_API_URL || "";
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get("content-type") || "";
  const txt = await res.text();
  let data = null;
  if (ct.includes("application/json") && txt) {
    data = JSON.parse(txt);
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}
