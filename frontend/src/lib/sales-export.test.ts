import { describe, expect, it } from 'vitest';
import { buildSalesCsv } from './sales-export';
import type { SaleRecord } from './sales-history';

const sale: SaleRecord = {
  id: 'VTA-001',
  fecha: '2026-10-19T10:00:00.000Z',
  cajero: 'Ana',
  metodo: 'efectivo_bs',
  total: 12.5,
  productos: [{ id: '1', name: 'Harina, "especial"', qty: 2, price: 6.25 }],
};

describe('buildSalesCsv', () => {
  it('quotes and escapes CSV values and includes BOM for spreadsheet compatibility', () => {
    const csv = buildSalesCsv([sale]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Harina, ""especial"" x2"');
    expect(csv).toContain('"12.50"');
  });

  it('neutralizes spreadsheet formula injection in untrusted text fields', () => {
    const csv = buildSalesCsv([{ ...sale, cajero: '=HYPERLINK("https://example.invalid")' }]);
    expect(csv).toContain(`"'=HYPERLINK(""https://example.invalid"")"`);
  });
});
