import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

function SidebarNav({ user }){
  return (
    <aside className="aside">
      <div className="brand"><span className="brand-badge" /> <div>Bhakti Vandana App</div></div>
      <nav className="s-nav">
        <NavLink to="/app">Dashboard</NavLink>
        {user?.role === 'admin' && <NavLink to="/users">Users Master</NavLink>}        
        {user?.role === 'admin' && <NavLink to="/stores">Stores Master</NavLink>}
        {user?.role === 'admin' && <NavLink to="/distributors">Distributors Masters</NavLink>}
        {user?.role === 'admin' && <NavLink to="/storetodistributor">Store Distributor</NavLink>}
        <NavLink to="/readers">Readers</NavLink>
      </nav>
    </aside>
  )
}

export default function Layout(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const navigate = useNavigate()
  function logout(){ localStorage.clear(); navigate('/') }
  return (
    <div className="container">
      <div className="shell">
        <SidebarNav user={user} />
        <main className="main">
          <div className="header">
            <div className="brand"><span className="brand-badge" /> Bhakti Vandana Apps ,<font-user>Welcome</font-user> <span className="badge">{user.email}</span></div>
            <div className="nav">
              <button className="btn" onClick={logout}>Logout</button>
            </div>
          </div>
          <div className="section">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
