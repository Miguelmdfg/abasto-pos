const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(DB);

db.serialize(() => {
  db.run("ALTER TABLE pagomovil ADD COLUMN sale_id INTEGER", (err) => {
    if (err) console.log('ALTER error (ignored):', err.message);
    db.all("PRAGMA table_info('pagomovil')", (err2, rows) => {
      if (err2) { console.error('ERR', err2); process.exit(1); }
      console.log(JSON.stringify(rows, null, 2));
      db.close();
    });
  });
});
