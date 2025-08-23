import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Users(){
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState('id')
  const [dir, setDir] = useState('desc')
  const [form, setForm] = useState({ id:null, email:'', name:'', role:'distribution', password:'' })
  const [msg, setMsg] = useState('')

  function query(){ const p = new URLSearchParams({ page:String(page), limit:String(limit), sort, dir }); return '/api/users?' + p.toString() }
  async function load(){ try{ const res = await api(query()); setList(res.data); setTotal(res.total) }catch(e){ setMsg(e.message) } }
  useEffect(()=>{ load() }, [page, limit, sort, dir])

  function validate(){
    if(!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Valid email required'
    if(!form.name) return 'Name required'
    if(!form.id && !form.password) return 'Password required for new user'
    return ''
  }
  function edit(row){ setForm({ ...row, password:'' }) }
  function cancel(){ setForm({ id:null, email:'', name:'', role:'distribution', password:'' }) }
  async function save(e){ e.preventDefault(); const v = validate(); if(v){ setMsg(v); return }
    setMsg(''); const body = { email:form.email, name:form.name, role:form.role }; if(form.password) body.password=form.password;
    try{ if(form.id){ await api(`/api/users/${form.id}`, { method:'PUT', body }) } else { await api('/api/users', { method:'POST', body }) }
      cancel(); load(); setMsg('Saved.'); setTimeout(()=>setMsg(''),1500)
    }catch(e){ setMsg(e.message) } }
  async function remove(id){ if(confirm('Delete this user?')){ await api(`/api/users/${id}`, { method:'DELETE' }); load() } }

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>User Master</h2>
        <div className="controls">
        </div>
      </div>
      <div className="card section">
        <form className="form" onSubmit={save}>
          <div className="form-row">
            <div><label>Email</label><input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div><label>Name</label><input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div><label>Role</label><select className="select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="admin">Admin</option><option value="distribution">Distribution</option></select></div>
            <div><label>{form.id ? 'New Password (optional)' : 'Password'}</label><input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
          </div>
          {msg && <div className="muted">{msg}</div>}
          <div style={{ display:'flex', gap:8 }}><button className="btn primary" type="submit">{form.id ? 'Update' : 'Add'}</button>{form.id && <button className="btn" type="button" onClick={cancel}>Cancel</button>}</div>
        </form>
      </div>

      <div className="card section">
        <table className="table">
          <thead><tr><th>ID</th><th>Email</th><th>Name</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>{list.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{r.email}</td><td>{r.name}</td><td><span className="badge">{r.role}</span></td><td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td><td><button className="btn" onClick={()=>edit(r)}>Edit</button>{' '}<button className="btn danger" onClick={()=>remove(r.id)}>Delete</button></td></tr>))}</tbody>
        </table>
      </div>

      <div className="toolbar">
        <div className="muted">Total: {total}</div>
        <div className="controls">
          <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button>
          <span className="badge">Page {page}</span>
          <button className="btn" onClick={()=>setPage(p=> (p*limit<total? p+1 : p))} disabled={page*limit>=total}>Next</button>
        </div>
      </div>
    </div>
  )
}
