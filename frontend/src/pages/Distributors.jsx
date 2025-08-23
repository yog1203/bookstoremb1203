import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
const LOCATIONS = ['Mumbai','Pune']

export default function Distributors(){
  const [list,setList] = useState([])
  const [total,setTotal] = useState(0)
  const [page,setPage] = useState(1)
  const [limit,setLimit] = useState(10)
  const [sort,setSort] = useState('id')
  const [dir,setDir] = useState('desc')
  const [form,setForm] = useState({ id:null, fname:'', mname:'', lname:'', address:'', mobile1:'', mobile2:'', email:'', location:'Mumbai' })

  function query(){ const p=new URLSearchParams({ page:String(page), limit:String(limit), sort, dir }); return '/api/distributors?'+p.toString() }
  async function load(){ const r=await api(query()); setList(r.data); setTotal(r.total) }
  useEffect(()=>{ load() }, [page,limit,sort,dir])
  function fullName(r){ return [r.fname, r.mname, r.lname].filter(Boolean).join(' ') }
  function edit(r){ setForm({ ...r }) }
  function cancel(){ setForm({ id:null, fname:'', mname:'', lname:'', address:'', mobile1:'', mobile2:'', email:'', location:'Mumbai' }) }

  function validate(){
    if(!form.fname) return 'First name required'
    if(!form.lname) return 'Last name required'
    if(!form.mobile1) return 'Mobile1 required'
    if(form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Email looks invalid'
    return ''
  }

  async function save(e){ e.preventDefault()
    const v = validate(); if(v){ alert(v); return }
    const body = { fname:form.fname, mname:form.mname, lname:form.lname, address:form.address, mobile1:form.mobile1, mobile2:form.mobile2, email:form.email, location:form.location }
    if(form.id) await api(`/api/distributors/${form.id}`, { method:'PUT', body }); else await api('/api/distributors', { method:'POST', body })
    cancel(); load()
  }
  async function remove(id){ if(confirm('Delete this distributor?')){ await api(`/api/distributors/${id}`, { method:'DELETE' }); load() } }

  return (<div>
    <div className="toolbar"><h2 style={{ margin: 0 }}>Distributor Master</h2><div className="controls">

    </div></div>

    <div className="card section">
      <form className="form" onSubmit={save}>
        <div className="form-row">
          <div><label>Fname *</label><input className="input" placeholder="" value={form.fname} onChange={e=>setForm({...form,fname:e.target.value})} /></div>
          <div><label>Mname</label><input className="input" placeholder="" value={form.mname} onChange={e=>setForm({...form,mname:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Lname *</label><input className="input" placeholder="" value={form.lname} onChange={e=>setForm({...form,lname:e.target.value})} /></div>
          <div><label>Location *</label><select className="select" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>{LOCATIONS.map(c=> <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div><label>Mobile1 *</label><input className="input" placeholder="" value={form.mobile1} onChange={e=>setForm({...form,mobile1:e.target.value})} /></div>
          <div><label>Mobile2</label><input className="input" placeholder="" value={form.mobile2} onChange={e=>setForm({...form,mobile2:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Email</label><input className="input" placeholder="" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
          <div><label>Address</label><input className="input" placeholder="" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
        </div>
        <div style={{display:'flex',gap:8}}><button className="btn primary" type="submit">{form.id?'Update':'Add'}</button>{form.id && <button className="btn" type="button" onClick={cancel}>Cancel</button>}</div>
      </form>
    </div>

    <div className="card section table-wrap">
      <table className="table"><thead><tr><th>ID</th><th>Name</th><th>Address</th><th>Mobile1</th><th>Mobile2</th><th>Email</th><th>Location</th><th>Actions</th></tr></thead>
        <tbody>{list.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{fullName(r)}</td><td>{r.address||'-'}</td><td>{r.mobile1}</td><td>{r.mobile2||'-'}</td><td>{r.email||'-'}</td><td>{r.location}</td><td><button className="btn" onClick={()=>edit(r)}>Edit</button>{' '}<button className="btn danger" onClick={()=>remove(r.id)}>Delete</button></td></tr>))}</tbody></table>
    </div>

    <div className="toolbar"><div className="muted">Total: {total}</div><div className="controls"><button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button><span className="badge">Page {page}</span><button className="btn" onClick={()=>setPage(p=> (p*limit<total? p+1 : p))} disabled={page*limit>=total}>Next</button></div></div>
  </div> )}
