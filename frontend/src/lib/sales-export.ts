import type { SaleRecord } from './sales-history';

function escapeCsv(value: string | number): string {
  const raw = String(value);
  const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildSalesCsv(sales: SaleRecord[]): string {
  const header = ['Código', 'Fecha', 'Cajero', 'Método', 'Detalle de pagos', 'Productos', 'Total Bs'];
  const rows = sales.map((sale) => [
    sale.id,
    sale.fecha,
    sale.cajero,
    sale.metodo,
    sale.payments?.map((payment) => `${payment.method}:${payment.amountBs.toFixed(2)} Bs`).join('; ') ?? '',
    sale.productos.map((product) => `${product.name} x${product.qty}`).join('; '),
    sale.total.toFixed(2),
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
}
