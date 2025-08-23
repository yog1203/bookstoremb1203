import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Books from './pages/Books'
import Distributors from './pages/Distributors'
import Readers from './pages/Readers'
import Stores from './pages/Stores'
import Users from './pages/Users'
import StoreToDistributor from './pages/StoreToDistributor'

function isAuthed(){ return !!localStorage.getItem('token') }
function Protected({ children }){ return isAuthed() ? children : <Navigate to='/' replace /> }
function RequireAdmin({ children }){ const u = JSON.parse(localStorage.getItem('user')||'{}'); return u.role==='admin' ? children : <Navigate to='/app' replace /> }

export default function App(){
  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/' element={<Protected><Layout /></Protected>}>
        <Route path='app' element={<Dashboard />} />
        <Route path='users' element={<RequireAdmin><Users /></RequireAdmin>} />
        <Route path='books' element={<Books />} />
        <Route path='distributors' element={<Distributors />} />
        <Route path='readers' element={<Readers />} />
        <Route path='stores' element={<RequireAdmin><Stores /></RequireAdmin>} />
        <Route path='storetodistributor' element={<RequireAdmin><StoreToDistributor /></RequireAdmin>} />
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  )
}
