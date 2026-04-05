import type { SaleRecord } from '../lib/sales-history';
import type { DebtItem } from '../lib/debts-context';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600000).toISOString();
}

// ─── Historial de ventas demo ─────────────────────────────────────────────────

export const DEMO_SALES: SaleRecord[] = [
  {
    id: 'VTA-20260405-1001', fecha: hoursAgo(1), cajero: 'Ana Méndez',
    metodo: 'pagomovil', total: 455, referencia: '748291', banco: 'Banesco',
    productos: [
      { id: 101, name: 'Arroz Mary Superior 1kg', qty: 2, price: 135 },
      { id: 201, name: 'Aceite Vatel 1L', qty: 1, price: 185 },
    ],
  },
  {
    id: 'VTA-20260405-1002', fecha: hoursAgo(2), cajero: 'Ana Méndez',
    metodo: 'efectivo_bs', total: 375,
    productos: [
      { id: 401, name: 'Galletas Club Social', qty: 2, price: 105 },
      { id: 317, name: 'Refresco Polar Naranja 400ml', qty: 3, price: 35 },
      { id: 808, name: 'Flaquito', qty: 1, price: 40 },
    ],
  },
  {
    id: 'VTA-20260405-1003', fecha: hoursAgo(3), cajero: 'Luis Ramos',
    metodo: 'mixto', total: 720, referencia: '382910', banco: 'Banco de Venezuela',
    monto_efectivo: 200, moneda_efectivo: 'bs',
    productos: [
      { id: 321, name: 'Leche Completa 1L', qty: 2, price: 120 },
      { id: 703, name: 'Margarina Mavesa 500g', qty: 2, price: 120 },
      { id: 105, name: 'Harina PAN 1kg', qty: 2, price: 120 },
    ],
  },
  {
    id: 'VTA-20260405-1004', fecha: hoursAgo(4), cajero: 'Ana Méndez',
    metodo: 'tarjeta', total: 490,
    productos: [
      { id: 207, name: 'Atún Marina 170gr', qty: 3, price: 100 },
      { id: 203, name: 'Sal Granelera 500g', qty: 2, price: 30 },
      { id: 416, name: 'Doritos Grande', qty: 1, price: 185 },
    ],
  },
  {
    id: 'VTA-20260405-1005', fecha: hoursAgo(5), cajero: 'Luis Ramos',
    metodo: 'efectivo_usd', total: 240,
    productos: [
      { id: 301, name: 'Bebida Agua Mineral 1.5lts', qty: 4, price: 30 },
      { id: 303, name: 'Bebida Gatorade 600ml', qty: 1, price: 90 },
      { id: 608, name: 'Esponja Jabonosa', qty: 1, price: 60 },
    ],
  },
  {
    id: 'VTA-20260405-1006', fecha: hoursAgo(6), cajero: 'Ana Méndez',
    metodo: 'pagomovil', total: 560, referencia: '129034', banco: 'Mercantil',
    productos: [
      { id: 103, name: 'Azúcar 1kg', qty: 2, price: 105 },
      { id: 102, name: 'Arroz Amanecer 900g', qty: 2, price: 130 },
      { id: 108, name: 'Pasta Capri 500g', qty: 2, price: 75 },
    ],
  },
  {
    id: 'VTA-20260404-2001', fecha: daysAgo(1), cajero: 'Ana Méndez',
    metodo: 'pagomovil', total: 770, referencia: '912847', banco: 'Mercantil',
    productos: [
      { id: 601, name: 'Abodo La Comadre 200g', qty: 2, price: 100 },
      { id: 603, name: 'Detergente Ariel 500g', qty: 2, price: 165 },
      { id: 607, name: 'Esponja Doble Uso', qty: 2, price: 20 },
      { id: 606, name: 'Esponja Brillo', qty: 2, price: 35 },
    ],
  },
  {
    id: 'VTA-20260404-2002', fecha: daysAgo(1), cajero: 'Luis Ramos',
    metodo: 'efectivo_bs', total: 630,
    productos: [
      { id: 705, name: 'Huevos Cartón x6', qty: 3, price: 70 },
      { id: 701, name: 'Queso Mano 250g', qty: 2, price: 145 },
      { id: 703, name: 'Margarina Mavesa 500g', qty: 1, price: 120 },
    ],
  },
  {
    id: 'VTA-20260404-2003', fecha: daysAgo(1), cajero: 'Ana Méndez',
    metodo: 'punto_venta', total: 455,
    productos: [
      { id: 507, name: 'Pasta Dental Colgate 75ml', qty: 2, price: 85 },
      { id: 505, name: 'Jabón de Baño Palmolive', qty: 3, price: 45 },
      { id: 510, name: 'Papel Higiénico Rosal x4', qty: 1, price: 120 },
    ],
  },
  {
    id: 'VTA-20260404-2004', fecha: daysAgo(1), cajero: 'Luis Ramos',
    metodo: 'mixto', total: 415, referencia: '556123', banco: 'BNC',
    monto_efectivo: 115, moneda_efectivo: 'usd',
    productos: [
      { id: 108, name: 'Pasta Capri 500g', qty: 3, price: 75 },
      { id: 204, name: 'Salsa de Tomate Heinz', qty: 2, price: 95 },
    ],
  },
  {
    id: 'VTA-20260403-3001', fecha: daysAgo(2), cajero: 'Ana Méndez',
    metodo: 'efectivo_bs', total: 1215,
    productos: [
      { id: 103, name: 'Azúcar 1kg', qty: 3, price: 105 },
      { id: 101, name: 'Arroz Mary Superior 1kg', qty: 3, price: 135 },
      { id: 105, name: 'Harina PAN 1kg', qty: 2, price: 120 },
      { id: 201, name: 'Aceite Vatel 1L', qty: 2, price: 185 },
    ],
  },
  {
    id: 'VTA-20260403-3002', fecha: daysAgo(2), cajero: 'Luis Ramos',
    metodo: 'pagomovil', total: 400, referencia: '204817', banco: 'BBVA Provincial',
    productos: [
      { id: 316, name: 'Bebida Energizante Black Bruin', qty: 4, price: 55 },
      { id: 302, name: 'Bebida Agua Mineral 600ml', qty: 10, price: 18 },
    ],
  },
  {
    id: 'VTA-20260403-3003', fecha: daysAgo(2), cajero: 'Ana Méndez',
    metodo: 'tarjeta', total: 780,
    productos: [
      { id: 506, name: 'Shampoo Head & Shoulders', qty: 2, price: 195 },
      { id: 509, name: 'Desodorante Axe 150ml', qty: 2, price: 150 },
      { id: 505, name: 'Jabón de Baño Palmolive', qty: 2, price: 45 },
    ],
  },
  {
    id: 'VTA-20260402-4001', fecha: daysAgo(3), cajero: 'Luis Ramos',
    metodo: 'efectivo_bs', total: 945,
    productos: [
      { id: 315, name: 'Bebida Cerveza Zulia', qty: 6, price: 95 },
      { id: 304, name: 'Bebida Powerade 600ml', qty: 3, price: 93 },
    ],
  },
  {
    id: 'VTA-20260402-4002', fecha: daysAgo(3), cajero: 'Ana Méndez',
    metodo: 'fiado', total: 755,
    productos: [
      { id: 101, name: 'Arroz Mary Superior 1kg', qty: 2, price: 135 },
      { id: 201, name: 'Aceite Vatel 1L', qty: 1, price: 185 },
      { id: 321, name: 'Leche Completa 1L', qty: 2, price: 120 },
      { id: 203, name: 'Sal Granelera 500g', qty: 2, price: 30 },
    ],
  },
  {
    id: 'VTA-20260401-5001', fecha: daysAgo(4), cajero: 'Luis Ramos',
    metodo: 'pagomovil', total: 430, referencia: '771432', banco: 'Bancamiga',
    productos: [
      { id: 809, name: 'Chocolate Savoy 45g', qty: 4, price: 65 },
      { id: 801, name: 'Gelatina Vasito', qty: 4, price: 45 },
      { id: 806, name: 'Gomitas Marshmellows', qty: 10, price: 5 },
    ],
  },
  {
    id: 'VTA-20260401-5002', fecha: daysAgo(4), cajero: 'Ana Méndez',
    metodo: 'efectivo_usd', total: 450,
    productos: [
      { id: 704, name: 'Huevos Cartón x30', qty: 1, price: 320 },
      { id: 702, name: 'Queso Blanco Duro 250g', qty: 1, price: 130 },
    ],
  },
  {
    id: 'VTA-20260331-6001', fecha: daysAgo(5), cajero: 'Luis Ramos',
    metodo: 'efectivo_bs', total: 631,
    productos: [
      { id: 410, name: 'Galletas Sáltimas/Noel 5', qty: 2, price: 125 },
      { id: 403, name: 'Galletas Crack', qty: 8, price: 17 },
      { id: 408, name: 'Galletas Charmy Unidad', qty: 6, price: 15 },
      { id: 416, name: 'Doritos Grande', qty: 1, price: 185 },
    ],
  },
  {
    id: 'VTA-20260331-6002', fecha: daysAgo(5), cajero: 'Ana Méndez',
    metodo: 'tarjeta', total: 1385,
    productos: [
      { id: 603, name: 'Detergente Ariel 500g', qty: 3, price: 165 },
      { id: 602, name: 'Cloro Clorox 1L', qty: 3, price: 85 },
      { id: 605, name: 'Suavizante Downy 500ml', qty: 2, price: 135 },
      { id: 610, name: 'Desinfectante Pinesol 500ml', qty: 2, price: 110 },
    ],
  },
  {
    id: 'VTA-20260330-7001', fecha: daysAgo(6), cajero: 'Luis Ramos',
    metodo: 'mixto', total: 441, referencia: '338271', banco: 'Banco del Tesoro',
    monto_efectivo: 150, moneda_efectivo: 'bs',
    productos: [
      { id: 502, name: 'Alcohol Antiséptico 120ml', qty: 3, price: 95 },
      { id: 503, name: 'Aromax Repelente', qty: 2, price: 42 },
      { id: 501, name: 'Afeitadora Maturbe', qty: 1, price: 30 },
    ],
  },
  {
    id: 'VTA-20260329-8001', fecha: daysAgo(7), cajero: 'Ana Méndez',
    metodo: 'pagomovil', total: 790, referencia: '902154', banco: 'Bicentenario',
    productos: [
      { id: 307, name: 'Bebida Malta 1.5lts', qty: 3, price: 150 },
      { id: 310, name: 'Bebida Jugo Del Valle 1.5lts', qty: 2, price: 80 },
      { id: 303, name: 'Bebida Gatorade 600ml', qty: 2, price: 90 },
    ],
  },
];

// ─── Clientes con deudas demo ─────────────────────────────────────────────────

export const DEMO_DEBTS: DebtItem[] = [
  {
    id: 1001,
    nombre: 'Carlos Pérez',
    telefono: '0414-1234567',
    cedula: 'V-12345678',
    limite_credito: 5000,
    deuda_total: 1830,
    ultima_compra: daysAgo(3),
    ventas: ['VTA-20260402-4002'],
    abonos: [
      { id: 1, fecha: daysAgo(2), monto: 500, nota: 'Abono parcial efectivo' },
    ],
  },
  {
    id: 1002,
    nombre: 'María González',
    telefono: '0424-9876543',
    cedula: 'V-22345678',
    limite_credito: 3000,
    deuda_total: 2450,
    ultima_compra: daysAgo(22),
    ventas: ['VTA-20260331-6001'],
    abonos: [],
  },
  {
    id: 1003,
    nombre: 'José Rodríguez',
    telefono: '0416-5551234',
    cedula: 'V-11987654',
    limite_credito: 4000,
    deuda_total: 960,
    ultima_compra: daysAgo(32),
    ventas: ['VTA-20260329-8001'],
    abonos: [
      { id: 2, fecha: daysAgo(15), monto: 300, nota: 'Abono pago móvil' },
    ],
  },
  {
    id: 1004,
    nombre: 'Ana Martínez',
    telefono: '0412-7778899',
    cedula: 'V-18765432',
    limite_credito: 4000,
    deuda_total: 0,
    ultima_compra: daysAgo(10),
    ventas: ['VTA-20260330-7001'],
    abonos: [
      { id: 3, fecha: daysAgo(8), monto: 441, nota: 'Pago total' },
    ],
  },
];
