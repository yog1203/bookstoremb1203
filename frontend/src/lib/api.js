export async function api(path, { method='GET', body, headers } = {}) {
  const base = import.meta.env.VITE_API_URL || '';
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers||{}) },
    body: body ? JSON.stringify(body) : undefined,
    // remove credentials unless you truly use cookies
    // credentials: 'include',
  });

  // read once
  const ct = res.headers.get('content-type') || '';
  const txt = await res.text();

  // Parse JSON only if it is JSON and not empty
  let data = null;
  if (ct.includes('application/json') && txt) {
    try { data = JSON.parse(txt); } 
    catch { throw new Error('Server returned invalid JSON'); }
  } else if (!res.ok) {
    // Show first part of HTML/text error to help debugging
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 160) || '(empty body)'}`);
  } else {
    // Non-JSON on success is unexpected for your API
    throw new Error(`Expected JSON, got: ${ct || 'unknown content-type'}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}
