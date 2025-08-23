import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
const BOOK_TYPES = ['BhaktiChaitanya-I','BhaktiChaitanya-II','BhaktiChaitanya-III']
const LANGUAGES = ['Marathi','Hindi','English']
const LOCATIONS = ['Mumbai','Pune']
function fmtDateInput(d){ if(!d) return ''; const x = new Date(d); const pad=n=>String(n).padStart(2,'0'); return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}` }

export default function Readers(){
  const [list,setList]=useState([]); const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1); const [limit,setLimit]=useState(10)
  const [sort,setSort]=useState('id'); const [dir,setDir]=useState('desc')
  const [form,setForm]=useState({ id:null, distributor_id:'', book_name:'BhaktiChaitanya-I', book_language:'Marathi', reader_type:'Individual', mediator_fname:'', mediator_lname:'', reader_fname:'', reader_lname:'', quantity:1, phone:'', date:fmtDateInput(new Date()), reader_place:'Mumbai' })
  const [distributors, setDistributors] = useState([]); const [readerTypes, setReaderTypes] = useState([])
  const distMap = useMemo(()=>Object.fromEntries(distributors.map(d=>[String(d.id), [d.fname,d.mname,d.lname].filter(Boolean).join(' ')])), [distributors])

  function query(){ const p=new URLSearchParams({ page:String(page), limit:String(limit), sort, dir }); return '/api/readers?'+p.toString() }
  async function load(){ const r=await api(query()); setList(r.data); setTotal(r.total) }
  async function loadMasters(){
    const d = await api('/api/distributors?limit=1000&sort=fname&dir=asc'); setDistributors(d.data||[])
    try{ const t = await api('/api/reader_types?limit=100&sort=name&dir=asc'); setReaderTypes((t.data||[]).map(x=>x.name)) } catch{ setReaderTypes(['Individual','Group','Organisation']) }
  }
  useEffect(()=>{ load() }, [page,limit,sort,dir])
  useEffect(()=>{ loadMasters() }, [])

  function edit(r){ setForm({ id:r.id, distributor_id:String(r.distributor_id||''), book_name:r.book_name, book_language:r.book_language, reader_type:r.reader_type, mediator_fname:r.mediator_fname||'', mediator_lname:r.mediator_lname||'', reader_fname:r.reader_fname||'', reader_lname:r.reader_lname||'', quantity:r.quantity||1, phone:r.phone||'', date:fmtDateInput(r.date||new Date()), reader_place:r.reader_place||'Mumbai' }) }
  function cancel(){ setForm({ id:null, distributor_id:String(distributors[0]?.id||''), book_name:'BhaktiChaitanya-I', book_language:'Marathi', reader_type: readerTypes[0]||'Individual', mediator_fname:'', mediator_lname:'', reader_fname:'', reader_lname:'', quantity:1, phone:'', date:fmtDateInput(new Date()), reader_place:'Mumbai' }) }

  function validate(){
    if(!form.distributor_id) return 'Distributor required'
    if(!form.reader_fname) return 'Reader first name required'
    if(!form.quantity || isNaN(Number(form.quantity))) return 'Quantity required'
    if(!form.phone) return 'Phone number required'
    if(!form.date) return 'Date required'
    return ''
  }
  async function save(e){ e.preventDefault(); const v=validate(); if(v){ alert(v); return }
    const body={ distributor_id:Number(form.distributor_id), book_name:form.book_name, book_language:form.book_language, reader_type:form.reader_type, mediator_fname:form.mediator_fname, mediator_lname:form.mediator_lname, reader_fname:form.reader_fname, reader_lname:form.reader_lname, quantity:Number(form.quantity), phone:form.phone, date:form.date, reader_place:form.reader_place }
    if(form.id) await api(`/api/readers/${form.id}`, { method:'PUT', body }); else await api('/api/readers', { method:'POST', body }); cancel(); load()
  }
  async function remove(id){ if(confirm('Delete this reader?')){ await api(`/api/readers/${id}`, { method:'DELETE' }); load() } }

  return (<div>
    <div className="toolbar"><h2 style={{ margin: 0 }}>Readers</h2><div className="controls">

    </div>
    </div>

    <div className="card section">
      <form className="form" onSubmit={save}>
        <div className="form-row">
          <div><label>Distributor *</label><select className="select" value={form.distributor_id} onChange={e=>setForm({...form,distributor_id:e.target.value})}><option value="">Select distributor</option>{distributors.map(d=>(<option key={d.id} value={String(d.id)}>{distMap[String(d.id)]}</option>))}</select></div>
          <div><label>Book Name *</label><select className="select" value={form.book_name} onChange={e=>setForm({...form,book_name:e.target.value})}>{BOOK_TYPES.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div><label>Book Language *</label><select className="select" value={form.book_language} onChange={e=>setForm({...form,book_language:e.target.value})}>{LANGUAGES.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
          <div><label>Reader Type *</label><select className="select" value={form.reader_type} onChange={e=>setForm({...form,reader_type:e.target.value})}>{(readerTypes.length?readerTypes:['Individual','Group','Organisation']).map(x=><option key={x} value={x}>{x}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div><label>Mediator FName</label><input className="input" value={form.mediator_fname} onChange={e=>setForm({...form,mediator_fname:e.target.value})} /></div>
          <div><label>Mediator LName</label><input className="input" value={form.mediator_lname} onChange={e=>setForm({...form,mediator_lname:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Reader FName *</label><input className="input" value={form.reader_fname} onChange={e=>setForm({...form,reader_fname:e.target.value})} /></div>
          <div><label>Reader LName</label><input className="input" value={form.reader_lname} onChange={e=>setForm({...form,reader_lname:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Quantity *</label><input className="input" type="number" min="1" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} /></div>
          <div><label>Phone number *</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <div><label>Date *</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
          <div><label>Reader Place *</label><select className="select" value={form.reader_place} onChange={e=>setForm({...form,reader_place:e.target.value})}>{LOCATIONS.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
        </div>
        <div style={{display:'flex',gap:8}}><button className="btn primary" type="submit">{form.id?'Update':'Add'}</button>{form.id && <button className="btn" type="button" onClick={cancel}>Cancel</button>}</div>
      </form>
    </div>

    <div className="card section table-wrap">
      <table className="table"><thead><tr><th>ID</th><th>Distributor</th><th>Book</th><th>Lang</th><th>Type</th><th>Reader</th><th>Qty</th><th>Phone</th><th>Date</th><th>Place</th><th>Actions</th></tr></thead>
        <tbody>{list.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{distMap[String(r.distributor_id)]||r.distributor_id}</td><td>{r.book_name}</td><td>{r.book_language}</td><td>{r.reader_type}</td><td>{[r.reader_fname,r.reader_lname].filter(Boolean).join(' ')}</td><td>{r.quantity}</td><td>{r.phone}</td><td>{r.date}</td><td>{r.reader_place}</td><td><button className="btn" onClick={()=>edit(r)}>Edit</button>{' '}<button className="btn danger" onClick={()=>remove(r.id)}>Delete</button></td></tr>))}</tbody></table>
    </div>

    <div className="toolbar"><div className="muted">Total: {total}</div><div className="controls"><button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button><span className="badge">Page {page}</span><button className="btn" onClick={()=>setPage(p=> (p*limit<total? p+1 : p))} disabled={page*limit>=total}>Next</button></div></div>
  </div> )}
