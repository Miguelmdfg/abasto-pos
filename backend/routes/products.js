const express = require('express');
const router = express.Router();
const db = require('../database');

// List products
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM productos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, category, price = 0, stock = 0 } = req.body;
    const result = await db.run(
      'INSERT INTO productos (name, category, price, stock) VALUES (?, ?, ?, ?)',
      [name, category, price, stock]
    );
    const product = await db.get('SELECT * FROM productos WHERE id = ?', [result.lastID]);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock, cost_usd, units_per_bundle, cost_per_bundle_usd } = req.body;
    await db.run(
      'UPDATE productos SET name = ?, category = ?, price = ?, stock = ?, cost_usd = ?, units_per_bundle = ?, cost_per_bundle_usd = ? WHERE id = ?',
      [name, category, price, stock, cost_usd, units_per_bundle, cost_per_bundle_usd, id]
    );
    const product = await db.get('SELECT * FROM productos WHERE id = ?', [id]);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Adjust stock: supports { stock } to set or { adjust } to increment/decrement
router.patch('/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, adjust, amount } = req.body;

    const current = await db.get('SELECT stock FROM productos WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ error: 'Producto no encontrado' });

    let newStock = current.stock || 0;

    if (typeof stock === 'number') newStock = stock;
    if (typeof adjust === 'number') newStock = newStock + adjust;
    if (typeof amount === 'number') newStock = newStock + amount;

    await db.run('UPDATE productos SET stock = ? WHERE id = ?', [newStock, id]);

    const product = await db.get('SELECT * FROM productos WHERE id = ?', [id]);
    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM productos WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
