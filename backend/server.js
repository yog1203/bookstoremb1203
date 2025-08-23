import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pkg from 'pg'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import helmet from 'helmet'
import compression from 'compression'

dotenv.config()
const { Pool } = pkg
const pool = new Pool()

const app = express()
app.set('trust proxy', 1)
app.use(cors())
app.use(helmet())
app.use(compression())
app.use(express.json())

app.get('/api', async (req, res) => {
  try { const now = await pool.query('SELECT NOW()'); res.json({ ok:true, message:`API OK @ ${now.rows[0].now}` }) }
  catch (e) { res.status(500).json({ ok:false, error:e.message }) }
})

function signToken(user){
  return jwt.sign({ sub:user.id, email:user.email, name:user.name, role:user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '4h' })
}
function auth(req,res,next){
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if(!token) return res.status(401).json({ ok:false, error:'Missing token' })
  try{ req.user = jwt.verify(token, process.env.JWT_SECRET); next() }catch(e){ return res.status(401).json({ ok:false, error:'Invalid token' }) }
}
function requireRole(role){ return (req,res,next)=>{ if(!req.user || req.user.role !== role) return res.status(403).json({ ok:false, error:`Forbidden (${role} only)` }); next() } }

app.post('/api/auth/login', async (req,res)=>{
  const { email, password } = req.body
  if(!email || !password) return res.status(400).json({ ok:false, error:'Email + password required' })
  try{
    const { rows } = await pool.query('SELECT id, email, name, role, password_hash FROM users WHERE email=$1', [email])
    const u = rows[0]; if(!u) return res.status(401).json({ ok:false, error:'Invalid credentials' })
    const ok = await bcrypt.compare(password, u.password_hash); if(!ok) return res.status(401).json({ ok:false, error:'Invalid credentials' })
    const token = signToken(u); res.json({ ok:true, token, user:{ id:u.id, email:u.email, name:u.name, role:u.role } })
  }catch(e){ res.status(500).json({ ok:false, error:e.message }) }
})

app.get('/api/me', auth, (req,res)=> res.json({ ok:true, user:req.user }))

// ---- Users admin endpoints ----
app.get('/api/users', auth, requireRole('admin'), async (req,res)=>{
  try{
    const q = (req.query.q||'').trim()
    const page = Math.max(parseInt(req.query.page||'1'),1)
    const limit = Math.min(Math.max(parseInt(req.query.limit||'10'),1),100)
    const offset = (page-1)*limit
    const sortable = ['id','email','name','role','created_at']
    const sort = sortable.includes(req.query.sort) ? req.query.sort : 'id'
    const dir = (req.query.dir||'desc').toLowerCase()==='asc' ? 'ASC' : 'DESC'

    let where = ''; const params = []
    if(q){
      const likeCols = ['email','name','role','id']
      const parts = likeCols.map((c)=>{ params.push(`%${q}%`); return (c==='id' ? `CAST(id AS TEXT)` : c) + ` ILIKE $${params.length}` })
      where = 'WHERE ' + parts.join(' OR ')
    }

    const total = (await pool.query(`SELECT COUNT(*)::int AS count FROM users ${where}`, params)).rows[0].count
    const data = (await pool.query(`SELECT id, email, name, role, created_at FROM users ${where} ORDER BY ${sort} ${dir} LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset])).rows
    res.json({ ok:true, page, limit, total, data })
  }catch(e){ res.status(500).json({ ok:false, error:e.message }) }
})

app.post('/api/users', auth, requireRole('admin'), async (req,res)=>{
  try{
    const { email, name, role='distribution', password } = req.body
    if(!email || !name || !password) return res.status(400).json({ ok:false, error:'email, name, password required' })
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(`INSERT INTO users (email, name, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, created_at`, [email, name, role, hash])
    res.json({ ok:true, data: rows[0] })
  }catch(e){
    if(String(e).includes('duplicate key')) return res.status(409).json({ ok:false, error:'Email already exists' })
    res.status(500).json({ ok:false, error:e.message })
  }
})

app.put('/api/users/:id', auth, requireRole('admin'), async (req,res)=>{
  try{
    const id = req.params.id
    const { email, name, role, password } = req.body
    const sets = []; const params = []
    if(email!=null){ params.push(email); sets.push(`email=$${params.length}`) }
    if(name!=null){ params.push(name); sets.push(`name=$${params.length}`) }
    if(role!=null){ params.push(role); sets.push(`role=$${params.length}`) }
    if(password){ const hash = await bcrypt.hash(password, 10); params.push(hash); sets.push(`password_hash=$${params.length}`) }
    if(!sets.length) return res.status(400).json({ ok:false, error:'No fields to update' })
    params.push(id)
    const { rows } = await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING id, email, name, role, created_at`, params)
    res.json({ ok:true, data: rows[0] })
  }catch(e){ res.status(500).json({ ok:false, error:e.message }) }
})

app.delete('/api/users/:id', auth, requireRole('admin'), async (req,res)=>{
  try{ await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]); res.json({ ok:true }) }
  catch(e){ res.status(500).json({ ok:false, error:e.message }) }
})

// pagination util
function paginatedSearch(table, fields){
  return async (req,res)=>{
    const q = (req.query.q || '').trim()
    const page = Math.max(parseInt(req.query.page||'1'),1)
    const limit = Math.min(Math.max(parseInt(req.query.limit||'10'),1),100)
    const offset = (page-1)*limit
    const sortable = ['id','created_at', ...Object.keys(fields)]
    const sort = sortable.includes(req.query.sort) ? req.query.sort : 'id'
    const dir = (req.query.dir||'desc').toLowerCase()==='asc' ? 'ASC' : 'DESC'

    let where = ''; const params = []
    if(q){
      const likeCols = Object.keys(fields).concat(['id']).filter(c=>c!=='created_at')
      const parts = likeCols.map((c)=>{ params.push(`%${q}%`); return (c==='id' ? `CAST(id AS TEXT)` : c) + ` ILIKE $${params.length}` })
      where = 'WHERE ' + parts.join(' OR ')
    }
    const total = (await pool.query(`SELECT COUNT(*)::int AS count FROM ${table} ${where}`, params)).rows[0].count
    const cols = ['id', ...Object.keys(fields), 'created_at']
    const data = (await pool.query(`SELECT ${cols.join(', ')} FROM ${table} ${where} ORDER BY ${sort} ${dir} LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset])).rows
    res.json({ ok:true, page, limit, total, data })
  }
}

// generic CRUDs
function buildCrud(table, fields, options={}){
  const gate = options.role ? requireRole(options.role) : (req,res,next)=>next()
  const base = `/api/${table}`
  app.get(base, auth, gate, paginatedSearch(table, fields))
  app.post(base, auth, gate, async (req,res)=>{
    const cols = Object.keys(fields); const vals = cols.map((c,i)=>`$${i+1}`); const args = cols.map(c=>req.body[c] ?? null)
    const { rows } = await pool.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.join(',')}) RETURNING *`, args)
    res.json({ ok:true, data: rows[0] })
  })
  app.put(`${base}/:id`, auth, gate, async (req,res)=>{
    const cols = Object.keys(fields); const sets = cols.map((c,i)=>`${c}=$${i+1}`); const args = cols.map(c=>req.body[c] ?? null); args.push(req.params.id)
    const { rows } = await pool.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id=$${cols.length+1} RETURNING *`, args)
    res.json({ ok:true, data: rows[0] })
  })
  app.delete(`${base}/:id`, auth, gate, async (req,res)=>{
    await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id])
    res.json({ ok:true })
  })
}

buildCrud('books', { title:'', author:'' })
buildCrud('distributors', { fname:'', mname:'', lname:'', address:'', mobile1:'', mobile2:'', email:'', location:'' })
buildCrud('reader_types', { name:'' })
buildCrud('readers', { distributor_id:0, book_name:'', book_language:'', reader_type:'', mediator_fname:'', mediator_lname:'', reader_fname:'', reader_lname:'', quantity:1, phone:'', date:'', reader_place:'' })
buildCrud('stores', { book_type:'', edition:0, book_language:'', issue_date:'', owner_id:0, quantity:0, location:'', faulty_books:0 }, { role:'admin' })

app.get('/api/dashboard/summary', auth, async (req,res)=>{
  try{
    const totalBooks = (await pool.query('SELECT COUNT(*) FROM books')).rows[0].count
    const totalDistributors = (await pool.query('SELECT COUNT(*) FROM distributors')).rows[0].count
    const totalReaders = (await pool.query('SELECT COUNT(*) FROM readers')).rows[0].count
    const totalStores = (await pool.query('SELECT COUNT(*) FROM stores')).rows[0].count
    const totalStoretodistbooks = (await pool.query('SELECT sum(quantity) FROM public.storetodistributor where edition=1')).rows[0].count
    res.json({ ok:true, totals:{ books:Number(totalBooks), distributors:Number(totalDistributors), readers:Number(totalReaders), stores:Number(totalStores), distributors:Number(totalStoretodistbooks) } })
  }catch(e){ res.status(500).json({ ok:false, error:e.message }) }
})

app.listen(process.env.PORT, ()=>console.log(`API running http://localhost:${process.env.PORT}`))


// Accurate, filterable dashboard
app.get('/api/dashboard', auth, async (req,res)=>{
  const from = req.query.from ? new Date(req.query.from) : null
  const to = req.query.to ? new Date(req.query.to) : null
  try{
    // Totals (global) + windowed aggregates
    const totalsBooks = (await pool.query('SELECT COALESCE(SUM(quantity),0)::int AS qty FROM stores')).rows[0].c
    const totalsDistributors = (await pool.query('SELECT COUNT(*)::int AS c FROM distributors')).rows[0].c
    const dist = (await pool.query('SELECT COALESCE(SUM(quantity),0)::int AS qty FROM storetodistributor')).rows[0].qty


    const readersQ = from && to
      ? await pool.query('SELECT COUNT(*)::int AS c FROM readers WHERE date BETWEEN $1::date AND $2::date', [from, to])
      : await pool.query('SELECT COUNT(*)::int AS c FROM readers')
    const readersCount = readersQ.rows[0].c

    const storesRowsQ = from && to
      ? await pool.query('SELECT COUNT(*)::int AS c, COALESCE(SUM(quantity),0)::int AS qty, COALESCE(SUM(faulty_books),0)::int AS faulty FROM stores WHERE issue_date::date BETWEEN $1::date AND $2::date', [from, to])
      : await pool.query('SELECT COUNT(*)::int AS c, COALESCE(SUM(quantity),0)::int AS qty, COALESCE(SUM(faulty_books),0)::int AS faulty FROM stores')
    const storesRows = storesRowsQ.rows[0].c
    const storesQty = storesRowsQ.rows[0].qty
    const faultyTotal = storesRowsQ.rows[0].faulty

    // Readers by Language / Type
    const rLang = from && to
      ? await pool.query("SELECT book_language AS label, COUNT(*)::int AS value FROM readers WHERE date BETWEEN $1::date AND $2::date GROUP BY book_language ORDER BY value DESC", [from, to])
      : await pool.query("SELECT book_language AS label, COUNT(*)::int AS value FROM readers GROUP BY book_language ORDER BY value DESC")
    const readersByLanguage = rLang.rows

    const rType = from && to
      ? await pool.query("SELECT reader_type AS label, COUNT(*)::int AS value FROM readers WHERE date BETWEEN $1::date AND $2::date GROUP BY reader_type ORDER BY value DESC", [from, to])
      : await pool.query("SELECT reader_type AS label, COUNT(*)::int AS value FROM readers GROUP BY reader_type ORDER BY value DESC")
    const readersByType = rType.rows

    // Stores by Book / Location (sum qty)
    const sBook = from && to
      ? await pool.query("SELECT book_type AS label, COALESCE(SUM(quantity),0)::int AS value FROM stores WHERE issue_date::date BETWEEN $1::date AND $2::date GROUP BY book_type ORDER BY value DESC", [from, to])
      : await pool.query("SELECT book_type AS label, COALESCE(SUM(quantity),0)::int AS value FROM stores GROUP BY book_type ORDER BY value DESC")
    const storesByBook = sBook.rows

    const sLoc = from && to
      ? await pool.query("SELECT location AS label, COALESCE(SUM(quantity),0)::int AS value FROM stores WHERE issue_date::date BETWEEN $1::date AND $2::date GROUP BY location ORDER BY value DESC", [from, to])
      : await pool.query("SELECT location AS label, COALESCE(SUM(quantity),0)::int AS value FROM stores GROUP BY location ORDER BY value DESC")
    const storesByLocation = sLoc.rows

    // Monthly time series (inclusive)
    const seriesReaders = from && to
      ? await pool.query(`
          WITH months AS (
            SELECT date_trunc('month', $1::date)::date AS start_m, date_trunc('month', $2::date)::date AS end_m
          ), gs AS (
            SELECT generate_series((SELECT start_m FROM months), (SELECT end_m FROM months), interval '1 month')::date AS m
          )
          SELECT to_char(gs.m, 'YYYY-MM') AS label,
                 COALESCE((SELECT COUNT(*) FROM readers r WHERE date_trunc('month', r.date) = gs.m), 0)::int AS value
          FROM gs ORDER BY gs.m
        `, [from, to])
      : await pool.query(`
          WITH months AS (
            SELECT date_trunc('month', CURRENT_DATE - interval '5 months')::date AS start_m,
                   date_trunc('month', CURRENT_DATE)::date AS end_m
          ), gs AS (
            SELECT generate_series((SELECT start_m FROM months), (SELECT end_m FROM months), interval '1 month')::date AS m
          )
          SELECT to_char(gs.m, 'YYYY-MM') AS label,
                 COALESCE((SELECT COUNT(*) FROM readers r WHERE date_trunc('month', r.date) = gs.m), 0)::int AS value
          FROM gs ORDER BY gs.m
        `)
    const monthlyReaders = seriesReaders.rows

    const seriesStores = from && to
      ? await pool.query(`
          WITH months AS (
            SELECT date_trunc('month', $1::date)::date AS start_m, date_trunc('month', $2::date)::date AS end_m
          ), gs AS (
            SELECT generate_series((SELECT start_m FROM months), (SELECT end_m FROM months), interval '1 month')::date AS m
          )
          SELECT to_char(gs.m, 'YYYY-MM') AS label,
                 COALESCE((SELECT SUM(quantity) FROM stores s WHERE date_trunc('month', s.issue_date) = gs.m), 0)::int AS value
          FROM gs ORDER BY gs.m
        `, [from, to])
      : await pool.query(`
          WITH months AS (
            SELECT date_trunc('month', CURRENT_DATE - interval '5 months')::date AS start_m,
                   date_trunc('month', CURRENT_DATE)::date AS end_m
          ), gs AS (
            SELECT generate_series((SELECT start_m FROM months), (SELECT end_m FROM months), interval '1 month')::date AS m
          )
          SELECT to_char(gs.m, 'YYYY-MM') AS label,
                 COALESCE((SELECT SUM(quantity) FROM stores s WHERE date_trunc('month', s.issue_date) = gs.m), 0)::int AS value
          FROM gs ORDER BY gs.m
        `)
    const monthlyStores = seriesStores.rows

    res.json({ ok:true, totals:{ books: totalsBooks, distributors: totalsDistributors, storetodistributors: dist, readers: readersCount, storesRows, storesQty, faultyTotal }, charts:{ readersByLanguage, readersByType, storesByBook, storesByLocation, monthlyReaders, monthlyStores } })
  }catch(e){ res.status(500).json({ ok:false, error:e.message }) }
})
