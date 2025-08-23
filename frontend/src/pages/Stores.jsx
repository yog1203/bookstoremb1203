import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
const BOOK_TYPES = ['BhaktiChaitanya-I','BhaktiChaitanya-II','BhaktiChaitanya-III']
const LANGUAGES = ['Marathi','Hindi','English']
const LOCATIONS = ['Mumbai','Pune']
function fmtDateLocal(dt){ if(!dt) return ''; const d = new Date(dt); const pad=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }

export default function Stores(){
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState('id')
  const [dir, setDir] = useState('desc')
  const [distributors, setDistributors] = useState([])
  const [form, setForm] = useState({ id:null, book_type:'BhaktiChaitanya-I', edition:1, book_language:'Marathi', issue_date: fmtDateLocal(new Date()), owner_id:'', quantity:0, location:'Mumbai', faulty_books:0 })
  const distMap = useMemo(()=>Object.fromEntries(distributors.map(d=>[String(d.id), [d.fname,d.mname,d.lname].filter(Boolean).join(' ')])), [distributors])

  function query(){ const p = new URLSearchParams({ page:String(page), limit:String(limit), sort, dir }); return '/api/stores?'+p.toString() }
  async function load(){ const res = await api(query()); setList(res.data); setTotal(res.total) }
  async function loadDistributors(){ const res = await api('/api/distributors?limit=1000&sort=fname&dir=asc'); setDistributors(res.data||[]); if(res.data?.length && !form.owner_id) setForm(f=>({...f, owner_id:String(res.data[0].id)})) }
  useEffect(()=>{ load() }, [page,limit,sort,dir])
  useEffect(()=>{ loadDistributors() }, [])

  function edit(r){ setForm({ id:r.id, book_type:r.book_type||'BhaktiChaitanya-I', edition:r.edition??1, book_language:r.book_language||'Marathi', issue_date:fmtDateLocal(r.issue_date||new Date()), owner_id:String(r.owner_id||''), quantity:r.quantity??0, location:r.location||'Mumbai', faulty_books:r.faulty_books??0 }) }
  function cancel(){ setForm({ id:null, book_type:'BhaktiChaitanya-I', edition:1, book_language:'Marathi', issue_date: fmtDateLocal(new Date()), owner_id:String(distributors[0]?.id||''), quantity:0, location:'Mumbai', faulty_books:0 }) }
  function validate(){ if(!form.book_type) return 'Book Type required'; if(!form.edition||isNaN(Number(form.edition))) return 'Edition must be a number'; if(!form.issue_date) return 'Issue Date required'; if(!form.owner_id) return 'Owner required'; if(form.quantity===''||isNaN(Number(form.quantity))) return 'Quantity must be a number'; return '' }
  async function save(e){ e.preventDefault(); const v=validate(); if(v){ alert(v); return }
    const body={ book_type:form.book_type, edition:Number(form.edition), book_language:form.book_language, issue_date:new Date(form.issue_date).toISOString(), owner_id:Number(form.owner_id), quantity:Number(form.quantity), location:form.location, faulty_books:Number(form.faulty_books||0) }
    if(form.id) await api(`/api/stores/${form.id}`, { method:'PUT', body }); else await api('/api/stores', { method:'POST', body }); cancel(); load(); }
  async function remove(id){ if(confirm('Delete this item?')){ await api(`/api/stores/${id}`, { method:'DELETE' }); load() } }

  return (<div>
    <div className="toolbar"><h2 style={{ margin:0 }}>Stores Master</h2><div className="controls">
      
    </div></div>

    <div className="card section">
      <form className="form" onSubmit={save}>
        <div className="form-row">
          <div><label>Book Type *</label><select className="select" value={form.book_type} onChange={e=>setForm({...form,book_type:e.target.value})}>{BOOK_TYPES.map(bt=> <option key={bt} value={bt}>{bt}</option>)}</select></div>
          <div><label>Edition *</label><input className="input" type="number" min="1" value={form.edition} onChange={e=>setForm({...form,edition:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Book Language *</label><select className="select" value={form.book_language} onChange={e=>setForm({...form,book_language:e.target.value})}>{['Marathi','Hindi','English'].map(l=> <option key={l} value={l}>{l}</option>)}</select></div>
          <div><label>Issue Date *</label><input className="input" type="datetime-local" value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Owner *</label><select className="select" value={form.owner_id} onChange={e=>setForm({...form,owner_id:e.target.value})}><option value="">Select owner</option>{distributors.map(d=> <option key={d.id} value={String(d.id)}>{distMap[String(d.id)]}</option>)}</select></div>
          <div><label>Quantity *</label><input className="input" type="number" min="0" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Location *</label><select className="select" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>{LOCATIONS.map(c=> <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label>Faulty books</label><input className="input" type="number" min="0" value={form.faulty_books} onChange={e=>setForm({...form,faulty_books:e.target.value})} /></div>
        </div>
        <div style={{display:'flex',gap:8}}><button className="btn primary" type="submit">{form.id ? 'Update' : 'Add'}</button>{form.id && <button className="btn" type="button" onClick={cancel}>Cancel</button>}</div>
      </form>
    </div>

    <div className="card section table-wrap">
      <table className="table"><thead><tr><th>ID</th><th>Book Type</th><th>Edition</th><th>Book Language</th><th>Issue Date</th><th>Owner</th><th>Quantity</th><th>Location</th><th>Faulty</th><th>Actions</th></tr></thead>
        <tbody>{list.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{r.book_type}</td><td>{r.edition}</td><td>{r.book_language}</td><td>{r.issue_date ? new Date(r.issue_date).toLocaleString() : '-'}</td><td>{distMap[String(r.owner_id)] || r.owner_id}</td><td>{r.quantity}</td><td>{r.location}</td><td>{r.faulty_books ?? 0}</td><td><button className="btn" onClick={()=>edit(r)}>Edit</button>{' '}<button className="btn danger" onClick={()=>remove(r.id)}>Delete</button></td></tr>))}</tbody></table>
    </div>

    <div className="toolbar"><div className="muted">Total: {total}</div><div className="controls"><button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button><span className="badge">Page {page}</span><button className="btn" onClick={()=>setPage(p=> (p*limit<total? p+1 : p))} disabled={page*limit>=total}>Next</button></div></div>
  </div> )}
