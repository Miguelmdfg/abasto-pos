const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Faltan datos' });
    const existing = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email ya registrado' });
    const hash = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO usuarios (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hash, role]);
    const user = await db.get('SELECT id, name, email, role FROM usuarios WHERE id = ?', [result.lastID]);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (returns user data, no token)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });
    const user = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
    // Return user without password
    const safe = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ ok: true, user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List users - only admin
// This endpoint requires header 'x-admin' === 'true' to allow listing users.
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.header('x-admin') === 'true';
    if (!isAdmin) return res.status(403).json({ error: 'Acceso denegado' });
    const rows = await db.all('SELECT id, name, email, role FROM usuarios ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
