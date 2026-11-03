import { describe, expect, it } from 'vitest';
import { buildCashClosuresCsv } from './cash-closure-export';
import type { CashierShift } from './cashier-shift';

const shift: CashierShift = {
  id: 'CIERRE-1',
  fecha: '2026-10-19T12:00:00.000Z',
  cajero: '=HYPERLINK("x")',
  subtotalProductos: 100,
  cantidadProductos: 5,
  creditosOtorgados: 0,
  totalVenta: 100,
  efectivoDivisas: 0,
  efectivoDivisasBs: 0,
  efectivoBolivares: 100,
  puntoVenta: 0,
  pagoMovil: 0,
  creditosPagados: 0,
  totalCaja: 100,
  diferencia: 0,
  estadoCuadre: 'cuadrado',
  cierresParciales: [],
  divisasRestante: 0,
  bolivaresRestante: 100,
  totalDejadoCaja: 100,
  distribucion: [],
  tasaCierre: 100,
};

describe('buildCashClosuresCsv', () => {
  it('exports summary values and escapes formula-like cashier data', () => {
    const csv = buildCashClosuresCsv([shift]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"100.00"');
    expect(csv).toContain('"cuadrado"');
  });
});
