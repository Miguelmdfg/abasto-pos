const express = require('express');
const router = express.Router();
const db = require('../database');

// Obtener sesión de caja activa
router.get('/sesion-activa', async (req, res) => {
  try {
    const sesion = await db.get('SELECT * FROM caja_sesiones WHERE estado = "abierta" ORDER BY id DESC LIMIT 1');
    res.json(sesion || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Abrir caja
router.post('/abrir', async (req, res) => {
  try {
    const { cajero, fondo_inicial_bs = 0, fondo_inicial_usd = 0 } = req.body;
    
    if (!cajero) {
      return res.status(400).json({ error: 'El nombre del cajero es requerido' });
    }

    // Verificar si ya hay una sesión abierta
    const sesionExistente = await db.get('SELECT * FROM caja_sesiones WHERE estado = "abierta"');
    if (sesionExistente) {
      return res.status(400).json({ error: 'Ya existe una sesión de caja abierta' });
    }

    const fecha_apertura = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO caja_sesiones (cajero, fecha_apertura, fondo_inicial_bs, fondo_inicial_usd, estado) VALUES (?, ?, ?, ?, "abierta")',
      [cajero, fecha_apertura, fondo_inicial_bs, fondo_inicial_usd]
    );

    const sesion = await db.get('SELECT * FROM caja_sesiones WHERE id = ?', [result.lastID]);
    res.status(201).json(sesion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cerrar caja
router.post('/cerrar', async (req, res) => {
  try {
    const { 
      sesion_id, 
      conteo_real_bs = 0, 
      conteo_real_usd = 0 
    } = req.body;

    if (!sesion_id) {
      return res.status(400).json({ error: 'El ID de sesión es requerido' });
    }

    const sesion = await db.get('SELECT * FROM caja_sesiones WHERE id = ?', [sesion_id]);
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (sesion.estado !== 'abierta') {
      return res.status(400).json({ error: 'La sesión ya está cerrada' });
    }

    // Calcular totales de ventas por método de pago durante la sesión
    const fechaInicio = sesion.fecha_apertura;
    const fechaCierre = new Date().toISOString();

    // Obtener todas las ventas desde la apertura hasta el cierre
    const ventas = await db.all(
      'SELECT * FROM ventas WHERE fecha >= ? AND fecha <= ?',
      [fechaInicio, fechaCierre]
    );

    // Calcular totales por método de pago
    let efectivo_bs = 0;
    let efectivo_usd = 0;
    let pago_movil = 0;
    let punto_venta = 0;
    let fiado = 0;
    let total_ventas_bs = 0;
    let total_ventas_usd = 0;

    ventas.forEach(v => {
      const total = Number(v.total || 0);
      const metodo = (v.metodo || '').toLowerCase();
      
      // Asumimos que las ventas en USD vienen marcadas o se pueden distinguir
      // Por simplicidad, asumimos todo en Bs a menos que se indique lo contrario
      if (metodo.includes('usd') || metodo.includes('dolar') || metodo.includes('$')) {
        efectivo_usd += total;
        total_ventas_usd += total;
      } else {
        if (metodo === 'efectivo') {
          efectivo_bs += total;
        } else if (metodo === 'pago_movil' || metodo === 'pagomovil') {
          pago_movil += total;
        } else if (metodo === 'punto_venta' || metodo === 'punto') {
          punto_venta += total;
        } else if (metodo === 'fiado' || metodo === 'credito') {
          fiado += total;
        }
        total_ventas_bs += total;
      }
    });

    // Efectivo teórico = Fondo inicial + Ventas en efectivo
    const efectivo_teorico_bs = Number(sesion.fondo_inicial_bs || 0) + efectivo_bs;
    const efectivo_teorico_usd = Number(sesion.fondo_inicial_usd || 0) + efectivo_usd;

    // Diferencia = Conteo real - Efectivo teórico
    const diferencia_bs = Number(conteo_real_bs) - efectivo_teorico_bs;
    const diferencia_usd = Number(conteo_real_usd) - efectivo_teorico_usd;

    // Actualizar sesión a cerrada
    await db.run(
      'UPDATE caja_sesiones SET estado = "cerrada", fecha_cierre = ? WHERE id = ?',
      [fechaCierre, sesion_id]
    );

    // Registrar cierre de caja
    const cierreResult = await db.run(
      `INSERT INTO cierre_caja (
        sesion_id, cajero, fecha_apertura, fecha_cierre,
        fondo_inicial_bs, fondo_inicial_usd,
        ventas_total_bs, ventas_total_usd,
        efectivo_teorico_bs, efectivo_teorico_usd,
        conteo_real_bs, conteo_real_usd,
        diferencia_bs, diferencia_usd,
        total_ventas, num_transacciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sesion_id,
        sesion.cajero,
        fechaInicio,
        fechaCierre,
        sesion.fondo_inicial_bs,
        sesion.fondo_inicial_usd,
        total_ventas_bs,
        total_ventas_usd,
        efectivo_teorico_bs,
        efectivo_teorico_usd,
        conteo_real_bs,
        conteo_real_usd,
        diferencia_bs,
        diferencia_usd,
        total_ventas_bs + total_ventas_usd,
        ventas.length
      ]
    );

    const cierre = await db.get('SELECT * FROM cierre_caja WHERE id = ?', [cierreResult.lastID]);
    res.json(cierre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener historial de cierres con filtros
router.get('/historial', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, cajero } = req.query;
    
    let query = 'SELECT * FROM cierre_caja WHERE 1=1';
    const params = [];

    if (fecha_inicio) {
      query += ' AND date(fecha_cierre) >= date(?)';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      query += ' AND date(fecha_cierre) <= date(?)';
      params.push(fecha_fin);
    }

    if (cajero) {
      query += ' AND cajero LIKE ?';
      params.push(`%${cajero}%`);
    }

    query += ' ORDER BY fecha_cierre DESC';

    const cierres = await db.all(query, params);
    res.json(cierres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener resumen de caja actual (para el modal de cierre)
router.get('/resumen/:sesion_id', async (req, res) => {
  try {
    const { sesion_id } = req.params;
    
    const sesion = await db.get('SELECT * FROM caja_sesiones WHERE id = ?', [sesion_id]);
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const fechaInicio = sesion.fecha_apertura;
    const fechaActual = new Date().toISOString();

    const ventas = await db.all(
      'SELECT * FROM ventas WHERE fecha >= ? AND fecha <= ?',
      [fechaInicio, fechaActual]
    );

    let efectivo_bs = 0;
    let efectivo_usd = 0;
    let pago_movil = 0;
    let punto_venta = 0;
    let fiado = 0;

    ventas.forEach(v => {
      const total = Number(v.total || 0);
      const metodo = (v.metodo || '').toLowerCase();
      
      if (metodo.includes('usd') || metodo.includes('dolar') || metodo.includes('$')) {
        efectivo_usd += total;
      } else {
        if (metodo === 'efectivo') {
          efectivo_bs += total;
        } else if (metodo === 'pago_movil' || metodo === 'pagomovil') {
          pago_movil += total;
        } else if (metodo === 'punto_venta' || metodo === 'punto') {
          punto_venta += total;
        } else if (metodo === 'fiado' || metodo === 'credito') {
          fiado += total;
        }
      }
    });

    const efectivo_teorico_bs = Number(sesion.fondo_inicial_bs || 0) + efectivo_bs;
    const efectivo_teorico_usd = Number(sesion.fondo_inicial_usd || 0) + efectivo_usd;

    res.json({
      sesion,
      ventas,
      desglose: {
        efectivo_bs,
        efectivo_usd,
        pago_movil,
        punto_venta,
        fiado
      },
      efectivo_teorico_bs,
      efectivo_teorico_usd,
      total_ventas: efectivo_bs + efectivo_usd + pago_movil + punto_venta + fiado,
      num_transacciones: ventas.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
