import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'autorent.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager')) NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    daily_price REAL NOT NULL,
    status TEXT CHECK(status IN ('bor', 'ijarada', 'tamirda', 'rezerv')) DEFAULT 'bor',
    image_url TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    passport_series TEXT NOT NULL,
    passport_number TEXT NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    return_date DATE,
    daily_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    payment_status TEXT CHECK(payment_status IN ('tolanmagan', 'qisman', 'tolangan')) DEFAULT 'tolanmagan',
    payment_type TEXT CHECK(payment_type IN ('naqd', 'karta', 'otkazma')),
    deposit_amount REAL DEFAULT 0,
    status TEXT CHECK(status IN ('aktiv', 'yakunlangan', 'bekor')) DEFAULT 'aktiv',
    notes TEXT,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (manager_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rental_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_type TEXT CHECK(payment_type IN ('naqd', 'karta', 'otkazma')),
    notes TEXT,
    FOREIGN KEY (rental_id) REFERENCES rentals(id)
  );
`);

export default db;
