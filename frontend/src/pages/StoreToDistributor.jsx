import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const BOOK_TYPES = ['BhaktiChaitanya-I','BhaktiChaitanya-II','BhaktiChaitanya-III']
const LANGUAGES = ['Marathi','Hindi','English']
const LOCATIONS = ['Mumbai','Pune']

function fmtDateInput(d){
  const z = n => String(n).padStart(2,'0')
  const dt = new Date(d)
  return `${dt.getFullYear()}-${z(dt.getMonth()+1)}-${z(dt.getDate())}`
}

export default function StoreToDistributor(){
  // table state
  const [list,setList] = useState([])
  const [total,setTotal] = useState(0)
  const [page,setPage] = useState(1)
  const [limit,setLimit] = useState(10)
  const [sort,setSort] = useState('id')
  const [dir,setDir] = useState('desc')

  // masters
  const [distributors,setDistributors] = useState([])
  const [editions,setEditions] = useState([1])
  const distMap = useMemo(
    () => Object.fromEntries(
      (distributors||[]).map(d => [
        String(d.id),
        [d.fname,d.mname,d.lname].filter(Boolean).join(' ')
      ])
    ),
    [distributors]
  )

  // form state + defaults
  const defaults = {
    id:null,
    distributor_id:'',
    book_type:'BhaktiChaitanya-I',
    book_language:'Marathi',
    edition:1,
    quantity:1,
    location:'Mumbai',
    distribution_date: fmtDateInput(new Date())
  }
  const [form,setForm] = useState(defaults)

  // queries
  function query(){
    const p = new URLSearchParams({ page:String(page), limit:String(limit), sort, dir })
    return '/api/storetodistributor?'+p.toString()
  }

  async function load(){
    const r = await api(query())
    setList(r.data||[])
    setTotal(r.total||0)
  }

  async function loadMasters(){
    const d = await api('/api/distributors?limit=1000&sort=fname&dir=asc')
    setDistributors(d.data||[])
    // editions from Stores table (distinct)
    try{
      const s = await api('/api/stores?limit=1000&sort=edition&dir=asc')
      const uniq = Array.from(new Set((s.data||[]).map(r=>Number(r.edition)).filter(Boolean))).sort((a,b)=>a-b)
      if(uniq.length) setEditions(uniq)
    }catch{}
  }

  useEffect(()=>{ load() }, [page,limit,sort,dir])
  useEffect(()=>{ loadMasters() }, [])

  // actions
  function edit(r){
    setForm({
      id: r.id,
      distributor_id: String(r.distributor_id || ''),
      book_type: r.book_type,
      book_language: r.book_language,
      edition: r.edition,
      quantity: r.quantity,
      location: r.location,
      distribution_date: r.distribution_date ? String(r.distribution_date).slice(0,10) : fmtDateInput(new Date())
    })
  }

  function clear(){
    setForm(defaults)
  }

  async function save(e){
    e.preventDefault()
    // minimal validation
    if(!form.distributor_id){ alert('Please select Distributor'); return }
    if(!form.quantity || Number(form.quantity) <= 0){ alert('Quantity must be > 0'); return }

    const payload = {
      distributor_id: Number(form.distributor_id),
      book_type: form.book_type,
      book_language: form.book_language,
      edition: Number(form.edition),
      quantity: Number(form.quantity),
      location: form.location,
      distribution_date: form.distribution_date
    }

    if(form.id){
      await api(`/api/storetodistributor/${form.id}`, { method:'PUT', body: payload })
    }else{
      await api('/api/storetodistributor', { method:'POST', body: payload })
    }
    clear()
    await load()
  }

  async function del(id){
    if(!confirm('Delete this record?')) return
    await api(`/api/storetodistributor/${id}`, { method:'DELETE' })
    await load()
  }

  // pagination helper
  const pages = Math.max(1, Math.ceil(total/limit))

  // simple header cell that toggles sort by column
  function Th({col, children}){
    return (
      <th
        onClick={()=>{
          if(sort===col){ setDir(d=>d==='asc'?'desc':'asc') } else { setSort(col); setDir('asc') }
        }}
        style={{ cursor:'pointer', whiteSpace:'nowrap' }}
        title="Click to sort"
      >
        {children} {sort===col ? (dir==='asc'?'▲':'▼') : ''}
      </th>
    )
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>StoreDistributor</h2>
      </div>

      <form className="grid grid-2" onSubmit={save}>
        <div className="form-field">
          <label>Distributor *</label>
          <select value={form.distributor_id} onChange={e=>setForm({ ...form, distributor_id:e.target.value })}>
            <option value="">Select…</option>
            {distributors.map(d=><option key={d.id} value={d.id}>{[d.fname,d.mname,d.lname].filter(Boolean).join(' ')}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>Book Type *</label>
          <select value={form.book_type} onChange={e=>setForm({ ...form, book_type:e.target.value })}>
            {BOOK_TYPES.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>Book Language *</label>
          <select value={form.book_language} onChange={e=>setForm({ ...form, book_language:e.target.value })}>
            {LANGUAGES.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>Edition *</label>
          <select value={form.edition} onChange={e=>setForm({ ...form, edition:e.target.value })}>
            {editions.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>Quantity *</label>
          <input type="number" min="1" value={form.quantity} onChange={e=>setForm({ ...form, quantity:e.target.value })} />
        </div>

        <div className="form-field">
          <label>Location *</label>
          <select value={form.location} onChange={e=>setForm({ ...form, location:e.target.value })}>
            {LOCATIONS.map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>Distribution Date *</label>
          <input type="date" value={form.distribution_date} onChange={e=>setForm({ ...form, distribution_date:e.target.value })} />
        </div>

        <div className="form-actions">
          <button className="btn primary" type="submit">{form.id ? 'Update' : 'Save'}</button>
          <button className="btn" type="button" onClick={clear}>Clear</button>
        </div>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <Th col="id">#</Th>
              <th>Distributor</th>
              <th>Book Type</th>
              <th>Language</th>
              <Th col="edition">Edition</Th>
              <Th col="quantity">Qty</Th>
              <th>Location</th>
              <Th col="distribution_date">Date</Th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(r=>(
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{distMap[String(r.distributor_id)] || r.distributor_id}</td>
                <td>{r.book_type}</td>
                <td>{r.book_language}</td>
                <td>{r.edition}</td>
                <td>{r.quantity}</td>
                <td>{r.location}</td>
                <td>{String(r.distribution_date).slice(0,10)}</td>
                <td>
                  <button className="btn sm" onClick={()=>edit(r)}>Edit</button>{' '}
                  <button className="btn sm danger" onClick={()=>del(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan="9">No records</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span>Total: {total}</span>
        <div className="spacer" />
        <button className="btn sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
        <span>Page {page}/{pages}</span>
        <button className="btn sm" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</button>
        <div className="spacer" />
        <label style={{display:'inline-flex',alignItems:'center',gap:8}}>
          Rows:
          <select value={limit} onChange={e=>{ setPage(1); setLimit(Number(e.target.value)) }}>
            {[5,10,20,50].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
    </div>
  )
}
