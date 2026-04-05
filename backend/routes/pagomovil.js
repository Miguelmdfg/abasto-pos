const express = require('express');
const router = express.Router();
const db = require('../database');

// List pagos
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM pagomovil ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register pago móvil
router.post('/', async (req, res) => {
  try {
    const { fecha = new Date().toISOString(), banco, referencia, monto = 0, cliente } = req.body;
    const result = await db.run(
      'INSERT INTO pagomovil (fecha, banco, referencia, monto, cliente) VALUES (?, ?, ?, ?, ?)',
      [fecha, banco, referencia, monto, cliente]
    );
    const pago = await db.get('SELECT * FROM pagomovil WHERE id = ?', [result.lastID]);
    res.status(201).json(pago);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
