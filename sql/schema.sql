CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'User',
  role TEXT NOT NULL DEFAULT 'distribution',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Distributors per spec
CREATE TABLE IF NOT EXISTS distributors (
  id SERIAL PRIMARY KEY,
  fname TEXT NOT NULL,
  mname TEXT,
  lname TEXT NOT NULL,
  address TEXT,
  mobile1 TEXT NOT NULL,
  mobile2 TEXT,
  email TEXT,
  location TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reader Types master
CREATE TABLE IF NOT EXISTS reader_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Readers per spec
CREATE TABLE IF NOT EXISTS readers (
  id SERIAL PRIMARY KEY,
  distributor_id INTEGER NOT NULL REFERENCES distributors(id) ON DELETE RESTRICT,
  book_name TEXT NOT NULL,
  book_language TEXT NOT NULL,
  reader_type TEXT NOT NULL,
  mediator_fname TEXT,
  mediator_lname TEXT,
  reader_fname TEXT NOT NULL,
  reader_lname TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  phone TEXT NOT NULL,
  date DATE NOT NULL,
  reader_place TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stores table per spec (admin only)
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  book_type TEXT NOT NULL,
  edition INTEGER NOT NULL,
  book_language TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES distributors(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  location TEXT NOT NULL,
  faulty_books INTEGER NOT NULL DEFAULT 0 CHECK (faulty_books >= 0),
  created_at TIMESTAMP DEFAULT NOW()
);
