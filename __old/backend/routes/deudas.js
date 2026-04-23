const express = require('express');
const router = express.Router();
const store = require('../deudas_store');

// List all clients
router.get('/', (req, res) => {
  const all = store.getAll();
  res.json(all);
});

// Add client
router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.id || !body.name) return res.status(400).json({ error: 'invalid' });
  const client = store.add(body);
  res.status(201).json(client);
});

// Update client
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const patched = store.update(id, req.body || {});
  if (!patched) return res.status(404).json({ error: 'not found' });
  res.json(patched);
});

// Delete client
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  store.remove(id);
  res.json({ ok: true });
});

// Add product to client
router.post('/:id/products', (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ error: 'invalid product' });
  const updated = store.addProduct(id, body);
  if (!updated) return res.status(404).json({ error: 'client not found' });
  res.status(201).json(updated);
});

// Remove product by index
router.delete('/:id/products/:index', (req, res) => {
  const id = req.params.id;
  const index = parseInt(req.params.index,10);
  const updated = store.removeProduct(id, index);
  if (!updated) return res.status(404).json({ error: 'client not found' });
  res.json(updated);
});

module.exports = router;
