const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB);

db.all('SELECT * FROM pagomovil WHERE sale_id IS NOT NULL', (err, rows) => {
  if (err) { console.error('ERR', err); process.exit(1); }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
