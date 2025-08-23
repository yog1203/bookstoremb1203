import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Books(){
  const [list,setList] = useState([]); const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1); const [limit,setLimit]=useState(10)
  const [sort,setSort]=useState('id'); const [dir,setDir]=useState('desc')
  const [form,setForm]=useState({ id:null, title:'', author:'' })
  function query(){ const p=new URLSearchParams({ page:String(page), limit:String(limit), sort, dir }); return '/api/books?'+p.toString() }
  async function load(){ const r=await api(query()); setList(r.data); setTotal(r.total) }
  useEffect(()=>{ load() }, [page,limit,sort,dir])
  function edit(r){ setForm(r) } function cancel(){ setForm({ id:null, title:'', author:'' }) }
  async function save(e){ e.preventDefault(); const body={ title:form.title, author:form.author }; if(form.id) await api(`/api/books/${form.id}`, { method:'PUT', body }); else await api('/api/books',{ method:'POST', body }); cancel(); load() }
  async function remove(id){ if(confirm('Delete this book?')){ await api(`/api/books/${id}`, { method:'DELETE' }); load() } }
  return (<div>
    <div className="toolbar"><h2 style={{ margin: 0 }}>Books</h2><div className="controls">
      <select className="select" value={sort} onChange={e=>setSort(e.target.value)}><option value="id">ID</option><option value="title">Title</option><option value="author">Author</option><option value="created_at">Created At</option></select>
      <select className="select" value={dir} onChange={e=>setDir(e.target.value)}><option value="desc">Desc</option><option value="asc">Asc</option></select>
      <select className="select" value={limit} onChange={e=>{setLimit(Number(e.target.value)); setPage(1)}}><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option></select>
    </div></div>
    <div className="card section">
      <form className="form" onSubmit={save}><div className="form-row">
        <div><label>Title</label><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
        <div><label>Author</label><input className="input" value={form.author} onChange={e=>setForm({...form,author:e.target.value})} /></div>
      </div><div style={{display:'flex',gap:8}}>
        <button className="btn primary" type="submit">{form.id?'Update':'Add'}</button>{form.id && <button className="btn" type="button" onClick={cancel}>Cancel</button>}
      </div></form>
    </div>
    <div className="card section"><table className="table"><thead><tr><th>ID</th><th>Title</th><th>Author</th><th>Actions</th></tr></thead>
      <tbody>{list.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{r.title}</td><td>{r.author||'-'}</td><td><button className="btn" onClick={()=>edit(r)}>Edit</button>{' '}<button className="btn danger" onClick={()=>remove(r.id)}>Delete</button></td></tr>))}</tbody></table></div>
    <div className="toolbar"><div className="muted">Total: {total}</div><div className="controls"><button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Prev</button><span className="badge">Page {page}</span><button className="btn" onClick={()=>setPage(p=> (p*limit<total? p+1 : p))} disabled={page*limit>=total}>Next</button></div></div>
  </div> )}
