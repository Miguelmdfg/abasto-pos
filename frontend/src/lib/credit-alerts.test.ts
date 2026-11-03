import { describe, expect, it } from 'vitest';
import { buildCreditAlerts } from './credit-alerts';
import type { DebtItem } from './debts-context';

const debt: DebtItem = {
  id: 'customer-1',
  nombre: 'Cliente',
  limite_credito: 1000,
  deuda_total: 300,
  abonos: [],
  ventas: [],
  creditNotes: [
    { id: 'note-1', code: 'NC-1', issuedAt: '2026-09-10T12:00:00.000Z', chargedBs: 200, balanceBs: 200 },
    { id: 'note-2', code: 'NC-2', issuedAt: '2026-10-18T12:00:00.000Z', chargedBs: 100, balanceBs: 0 },
  ],
};

describe('buildCreditAlerts', () => {
  it('alerts from outstanding note dates, excluding paid notes', () => {
    expect(buildCreditAlerts([debt], 30, new Date('2026-10-19T12:00:00.000Z'))).toEqual([{
      customerId: 'customer-1',
      customerName: 'Cliente',
      noteCode: 'NC-1',
      balanceBs: 200,
      daysOutstanding: 39,
      status: 'vencida',
    }]);
  });

  it('uses the configured due-soon window and leaves recent notes current', () => {
    const alerts = buildCreditAlerts([debt], 30, new Date('2026-10-19T12:00:00.000Z'));
    const recent = buildCreditAlerts([{
      ...debt,
      creditNotes: [{ ...debt.creditNotes![0], issuedAt: '2026-09-22T12:00:00.000Z' }],
    }], 30, new Date('2026-10-19T12:00:00.000Z'));
    expect(alerts[0].status).toBe('vencida');
    expect(recent[0].status).toBe('por_vencer');
  });
});
