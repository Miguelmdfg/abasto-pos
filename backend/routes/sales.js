const express = require('express');
const router = express.Router();
const db = require('../database');

// List sales
router.get('/', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM ventas ORDER BY id DESC');
    // parse productos JSON before returning
    const parsed = rows.map(r => ({ ...r, productos: tryParse(r.productos) }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function tryParse(val) {
  try {
    return JSON.parse(val);
  } catch (e) {
    return val;
  }
}

// Register sale
router.post('/', async (req, res) => {
  // Validate availability first, then apply stock updates and record the sale.
  try {
    const { fecha = new Date().toISOString(), productos = [], metodo = 'efectivo', total = 0 } = req.body;

    // If frontend sent a string (e.g. "Pan x2, Leche x1"), just record the sale
    // and do NOT modify stock (frontend handles PATCH updates). If frontend
    // sends an array of items with `id` and `qty`, backend will validate and
    // deduct stock atomically inside a transaction.
    if (typeof productos === 'string') {
      const productosText = productos;
      const result = await db.run(
        'INSERT INTO ventas (fecha, productos, metodo, total) VALUES (?, ?, ?, ?)',
        [fecha, productosText, metodo, total]
      );
      const sale = await db.get('SELECT * FROM ventas WHERE id = ?', [result.lastID]);
      res.status(201).json(sale);
      return;
    }

    const items = Array.isArray(productos) ? productos : [];
    const pago = req.body.pagomovil || req.body.pagoMovil || null;
    const pagomovilId = req.body.pagomovilId || req.body.pagoMovilId || null;
    console.log('[sales] req.body full:', JSON.stringify(req.body));
    console.log('[sales] payload pago/pagomovil:', { pago, pagomovilId });

    try {
      const insertedId = await db.withTransaction(async ({ run: runTx, get: getTx }) => {
        // Validate availability for each item
        for (const item of items) {
          const pid = item.id;
          const qty = Number(item.qty || item.quantity || 0);
          if (!pid || qty <= 0) throw new Error('Producto inválido o cantidad');
          const product = await getTx('SELECT stock FROM productos WHERE id = ?', [pid]);
          if (!product) throw new Error(`Producto ${pid} no encontrado`);
          const currentStock = Number(product.stock || 0);
          if (currentStock - qty < 0) throw new Error(`Stock insuficiente para producto ${pid}`);
        }

        // Apply updates
        for (const item of items) {
          const pid = item.id;
          const qty = Number(item.qty || item.quantity || 0);
          const product = await getTx('SELECT stock FROM productos WHERE id = ?', [pid]);
          const newStock = Number(product.stock || 0) - qty;
          await runTx('UPDATE productos SET stock = ? WHERE id = ?', [newStock, pid]);
        }

        // Insert sale record
        const saleRes = await runTx('INSERT INTO ventas (fecha, productos, metodo, total) VALUES (?, ?, ?, ?)', [fecha, JSON.stringify(items), metodo, total]);
        const saleId = saleRes.lastID;

        // If pagomovil data present as an object, insert payment and link to sale
        if (pago && typeof pago === 'object') {
          const { banco, referencia, monto = 0, cliente } = pago;
          console.log('[sales] inserting pagomovil for sale', saleId, { banco, referencia, monto, cliente });
          const pmRes = await runTx('INSERT INTO pagomovil (fecha, banco, referencia, monto, cliente, sale_id) VALUES (?, ?, ?, ?, ?, ?)', [fecha, banco, referencia, monto, cliente, saleId]);
          console.log('[sales] pagomovil inserted id=', pmRes.lastID);
        }

        // If pagomovilId was provided (created previously by frontend), link it to this sale
        if (pagomovilId) {
            console.log('[sales] attempting to link existing pagomovil', pagomovilId, 'to sale', saleId);
            const updRes = await runTx('UPDATE pagomovil SET sale_id = ? WHERE id = ?', [saleId, pagomovilId]);
            console.log('[sales] update result for pagomovil link:', updRes);
            try {
              const linkedRow = await getTx('SELECT * FROM pagomovil WHERE id = ?', [pagomovilId]);
              console.log('[sales] pagomovil row after update:', linkedRow);
            } catch (selErr) {
              console.log('[sales] error selecting pagomovil after update', selErr && selErr.message ? selErr.message : selErr);
            }
        }

        return saleId;
      });

      const sale = await db.get('SELECT * FROM ventas WHERE id = ?', [insertedId]);
      sale.productos = typeof sale.productos === 'string' ? JSON.parse(sale.productos) : sale.productos;
        // Debug helper: if pagomovilId was provided, fetch the linked pagomovil row
        if (pagomovilId) {
          try {
            const linked = await db.get('SELECT * FROM pagomovil WHERE id = ?', [pagomovilId]);
            sale.pagomovil_linked = linked;
          } catch (e) {
            // ignore
          }
        }
      res.status(201).json(sale);
      return;
    } catch (err) {
      const msg = err && err.message ? err.message : 'Error procesando la venta';
      return res.status(400).json({ error: msg });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
