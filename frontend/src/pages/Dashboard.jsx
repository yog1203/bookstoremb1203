import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

const PALETTE = ['#6366f1', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f97316']
const GRADIENTS = [
  ['#6366f1','#06b6d4'],
  ['#22c55e','#a3e635'],
  ['#f59e0b','#f97316'],
  ['#ef4444','#f43f5e']
]

function Card({ children, className='' }){
  return <div className={'card section ' + className} style={{ overflow:'hidden' }}>{children}</div>
}

function KPI({ label, value, idx=0 }){
  const g = GRADIENTS[idx % GRADIENTS.length]
  return (
    <motion.div className="kpi-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, delay: .05*idx }} style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{(value ?? '-')}</div>
    </motion.div>
  )
}


export default function Dashboard(){
  const [data, setData] = useState(null)
  const [from, setFrom] = useState(()=>{
    const d = new Date(); d.setMonth(d.getMonth()-5); d.setDate(1);
    return d.toISOString().slice(0,10)
  })
  const [to, setTo] = useState(()=> new Date().toISOString().slice(0,10))
  const charts = data?.charts || {}
  const totals = data?.totals || {}

  async function load(){
    const qs = new URLSearchParams({ from, to }).toString()
    const d = await api('/api/dashboard?'+qs)
    setData(d)
  }
  useEffect(()=>{ load() }, [])

  const storesTotalQty = totals.storesQty ?? 0
  const distributedTotalQty = totals.storetodistributors ?? 0
  


  return (
    <div className="dash-root">
      <div className="toolbar">
        <h2 style={{ margin: 0, color:'#0f172a' }}>Organization Overview</h2>
        {/* <div className="controls">
          <label>From</label><input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <label>To</label><input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
          <button className="btn primary" onClick={load}>Apply</button>
        </div> */}
      </div>

      {/* KPI row */}
      <div className="grid-kpis">
        <KPI label="Total Books" value={storesTotalQty} idx={3} />
        <KPI label="Store Quantity Distributed" value={distributedTotalQty} idx={1} />
        <KPI label="Store Available Quantity" value={storesTotalQty-distributedTotalQty} idx={0} />
        <KPI label="Distributer Master" value={totals.distributors} idx={1} />
        <KPI label="Readers" value={totals.readers} idx={2} />
       
      </div>

      <div className="grid-2">
        <Card>
          <div className="header"><div>Readers (by month)</div><div className="muted">Window: {from} → {to}</div></div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyReaders || []} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="Readers" stroke={PALETTE[0]} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="header"><div>Store Quantity (by month)</div><div className="muted">Window: {from} → {to}</div></div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyStores || []} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Quantity" fill={PALETTE[3]} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="header"><div>Readers by Language</div><div className="muted">Filtered</div></div>
          <div className="flex-2">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={charts.readersByLanguage || []} dataKey="value" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {(charts.readersByLanguage||[]).map((_,i)=>(<Cell key={i} fill={PALETTE[i % PALETTE.length]} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-list">
              {(charts.readersByLanguage||[]).map((r,i)=> (
                <div key={r.label} className="row">
                  <span className="dot" style={{ background: PALETTE[i%PALETTE.length] }} />
                  <span className="label">{r.label}</span>
                  <span className="value">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="header"><div>Store Qty by Book</div><div className="muted">Filtered</div></div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.storesByBook || []} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Quantity" fill={PALETTE[2]} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="header"><div>Readers by Type</div><div className="muted">Filtered</div></div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.readersByType || []} layout="vertical" margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="label" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Readers" fill={PALETTE[1]} radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="header"><div>Store Qty by Location</div><div className="muted">Filtered</div></div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.storesByLocation || []} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Quantity" fill={PALETTE[5]} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
