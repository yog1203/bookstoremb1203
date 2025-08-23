import dotenv from 'dotenv'
import pkg from 'pg'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()
const { Pool } = pkg
const pool = new Pool()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run(){
  try{
    const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8')

    // auto-migrate: drop legacy tables if old schema detected
    await pool.query(`
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='distributors') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='distributors' AND column_name='fname') THEN
      DROP TABLE IF EXISTS readers CASCADE;
      DROP TABLE IF EXISTS stores CASCADE;
      DROP TABLE IF EXISTS distributors CASCADE;
    END IF;
  END IF;
END $$;`)

    await pool.query(schema)

    // users
    const hashAdmin = await bcrypt.hash('Admin@123', 10)
    await pool.query(`INSERT INTO users (email, password_hash, name, role) VALUES ('admin@example.com',$1,'Admin','admin') ON CONFLICT (email) DO NOTHING`, [hashAdmin])
    const hashDist = await bcrypt.hash('Dist@123', 10)
    await pool.query(`INSERT INTO users (email, password_hash, name, role) VALUES ('distribution@example.com',$1,'Distribution','distribution') ON CONFLICT (email) DO NOTHING`, [hashDist])

    // reader types
    await pool.query(`INSERT INTO reader_types (name) VALUES ('Individual') ON CONFLICT (name) DO NOTHING`)
    await pool.query(`INSERT INTO reader_types (name) VALUES ('Group') ON CONFLICT (name) DO NOTHING`)
    await pool.query(`INSERT INTO reader_types (name) VALUES ('Organisation') ON CONFLICT (name) DO NOTHING`)

    // distributor sample
    const dist = await pool.query(`INSERT INTO distributors (fname,mname,lname,address,mobile1,mobile2,email,location)
      VALUES ('Gauri','Mmm','Surve','204 db woods, Mumbai','78678997','78678996','m@gmail.com','Mumbai')
      ON CONFLICT DO NOTHING RETURNING id`)
    const distId = dist.rows[0]?.id || (await pool.query('SELECT id FROM distributors LIMIT 1')).rows[0].id

    // store sample (needs a distributor for owner_id)
    await pool.query(`INSERT INTO stores (book_type, edition, book_language, issue_date, owner_id, quantity, location, faulty_books)
      VALUES ('BhaktiChaitanya-I', 1, 'Marathi', NOW(), $1, 1200, 'Mumbai', 18)`, [distId])

    // reader sample
    await pool.query(`INSERT INTO readers (distributor_id, book_name, book_language, reader_type, mediator_fname, mediator_lname, reader_fname, reader_lname, quantity, phone, date, reader_place)
      VALUES ($1,'BhaktiChaitanya-I','Marathi','Individual','Ramesh','','Hari','Achrekar',1,'9769990826', CURRENT_DATE, 'Mumbai')`, [distId])

    console.log('Seed complete')
    process.exit(0)
  }catch(e){
    console.error('Seed error:', e)
    process.exit(1)
  }
}
run()
