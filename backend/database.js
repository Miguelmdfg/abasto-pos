
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB_PATH);

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    price REAL,
    stock INTEGER,
    cost_usd REAL DEFAULT 0,
    units_per_bundle INTEGER DEFAULT 1,
    cost_per_bundle_usd REAL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    productos TEXT,
    metodo TEXT,
    total REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pagomovil (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    banco TEXT,
    referencia TEXT,
    monto REAL,
    cliente TEXT
  )`);
  // Add sale_id column if it doesn't exist (safe attempt; ignore error if exists)
  db.run('ALTER TABLE pagomovil ADD COLUMN sale_id INTEGER', (err) => {
    // ignore error: column may already exist
  });

  // Tabla para sesiones de caja
  db.run(`CREATE TABLE IF NOT EXISTS caja_sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cajero TEXT,
    fecha_apertura TEXT,
    fondo_inicial_bs REAL DEFAULT 0,
    fondo_inicial_usd REAL DEFAULT 0,
    fecha_cierre TEXT,
    estado TEXT DEFAULT 'abierta'
  )`);

  // Tabla para cierres de caja
  db.run(`CREATE TABLE IF NOT EXISTS cierre_caja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion_id INTEGER,
    cajero TEXT,
    fecha_apertura TEXT,
    fecha_cierre TEXT,
    fondo_inicial_bs REAL DEFAULT 0,
    fondo_inicial_usd REAL DEFAULT 0,
    ventas_total_bs REAL DEFAULT 0,
    ventas_total_usd REAL DEFAULT 0,
    efectivo_teorico_bs REAL DEFAULT 0,
    efectivo_teorico_usd REAL DEFAULT 0,
    conteo_real_bs REAL DEFAULT 0,
    conteo_real_usd REAL DEFAULT 0,
    diferencia_bs REAL DEFAULT 0,
    diferencia_usd REAL DEFAULT 0,
    total_ventas INTEGER DEFAULT 0,
    num_transacciones INTEGER DEFAULT 0,
    FOREIGN KEY (sesion_id) REFERENCES caja_sesiones(id)
  )`);
});

// Promise-wrapper helpers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Run an async callback inside a DB transaction. The callback receives
// helpers { run, get, all } which return Promises. BEGIN/COMMIT/ROLLBACK are
// used to ensure atomicity.
function withTransaction(callback) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', async (beginErr) => {
        if (beginErr) return reject(beginErr);
        try {
          const result = await callback({ run, get, all });
          db.run('COMMIT', (commitErr) => {
            if (commitErr) return reject(commitErr);
            resolve(result);
          });
        } catch (err) {
          db.run('ROLLBACK', () => {
            reject(err);
          });
        }
      });
    });
  });
}

module.exports = { db, run, get, all, withTransaction };
