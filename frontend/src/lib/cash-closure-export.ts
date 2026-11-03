import type { CashierShift } from './cashier-shift';

function escapeCsv(value: string | number): string {
  const raw = String(value);
  const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildCashClosuresCsv(shifts: CashierShift[]): string {
  const header = [
    'Código',
    'Fecha',
    'Cajero',
    'Ventas Bs',
    'Monto contado Bs',
    'Diferencia Bs',
    'Estado',
    'Tasa BCV',
  ];
  const rows = shifts.map((shift) => [
    shift.id,
    shift.fecha,
    shift.cajero,
    shift.totalVenta.toFixed(2),
    shift.totalCaja.toFixed(2),
    shift.diferencia.toFixed(2),
    shift.estadoCuadre,
    shift.tasaCierre.toFixed(8),
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
}
