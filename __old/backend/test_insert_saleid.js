const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB);
const fecha = new Date().toISOString();

db.run('INSERT INTO pagomovil (fecha, banco, referencia, monto, cliente, sale_id) VALUES (?, ?, ?, ?, ?, ?)', [fecha, 'T', 'R', 1, 'C', 999], function(err) {
  if (err) { console.error('ERR INSERT', err); process.exit(1); }
  const id = this.lastID;
  db.get('SELECT * FROM pagomovil WHERE id = ?', [id], (err2, row) => {
    if (err2) { console.error('ERR SELECT', err2); process.exit(1); }
    console.log('INSERTED ROW:', JSON.stringify(row, null, 2));
    db.close();
  });
});
