import type { DebtItem } from './debts-context';

export type CreditAgingStatus = 'al_dia' | 'por_vencer' | 'vencida' | 'saldada';

export type CreditAlert = {
  customerId: string | number;
  customerName: string;
  noteCode?: string;
  balanceBs: number;
  daysOutstanding: number;
  status: Exclude<CreditAgingStatus, 'saldada'>;
};

export function buildCreditAlerts(
  debts: DebtItem[],
  overdueDays: number,
  now = new Date(),
): CreditAlert[] {
  const threshold = Number.isFinite(overdueDays) && overdueDays > 0 ? overdueDays : 30;
  const dueSoonThreshold = Math.max(1, threshold - 5);
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return debts.flatMap((debt) => {
    const notes = debt.creditNotes?.length
      ? debt.creditNotes
        .filter((note) => note.balanceBs > 0)
        .map((note) => ({ code: note.code, balanceBs: note.balanceBs, issuedAt: note.issuedAt }))
      : debt.deuda_total > 0
        ? [{ code: undefined, balanceBs: debt.deuda_total, issuedAt: debt.ultima_compra }]
        : [];

    return notes.flatMap((note) => {
      const issued = note.issuedAt ? new Date(note.issuedAt) : null;
      if (!issued || !Number.isFinite(issued.getTime())) return [];
      const issuedDay = Date.UTC(issued.getFullYear(), issued.getMonth(), issued.getDate());
      const daysOutstanding = Math.max(0, Math.floor((nowDay - issuedDay) / 86_400_000));
      const status: CreditAlert['status'] = daysOutstanding >= threshold
        ? 'vencida'
        : daysOutstanding >= dueSoonThreshold
          ? 'por_vencer'
          : 'al_dia';

      return [{
        customerId: debt.id,
        customerName: debt.nombre,
        noteCode: note.code,
        balanceBs: note.balanceBs,
        daysOutstanding,
        status,
      }];
    });
  });
}
