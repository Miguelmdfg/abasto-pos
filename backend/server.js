const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');
const salesRouter = require('./routes/sales');
const usersRouter = require('./routes/users');
const pagomovilRouter = require('./routes/pagomovil');
const deudasRouter = require('./routes/deudas');
const cajaRouter = require('./routes/caja');

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/products', productsRouter);
app.use('/sales', salesRouter);
app.use('/users', usersRouter);
app.use('/pagomovil', pagomovilRouter);
app.use('/deudas', deudasRouter);
app.use('/caja', cajaRouter);

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'BodegaFlow backend running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
