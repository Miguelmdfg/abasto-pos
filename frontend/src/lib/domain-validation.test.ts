import { describe, expect, it } from 'vitest';
import { paymentsMatchTotal, stockAfterAdjustment } from './domain-validation';

describe('paymentsMatchTotal', () => {
  it('accepts payments that reconcile to the sale total', () => {
    expect(paymentsMatchTotal([100, 50], 150)).toBe(true);
  });

  it('rejects payments that do not reconcile', () => {
    expect(paymentsMatchTotal([100, 49], 150)).toBe(false);
  });

  it('rejects empty or non-positive payments', () => {
    expect(paymentsMatchTotal([], 0)).toBe(false);
    expect(paymentsMatchTotal([0, 100], 100)).toBe(false);
  });
});

describe('stockAfterAdjustment', () => {
  it('returns the new stock for valid adjustments', () => {
    expect(stockAfterAdjustment(10, -3)).toBe(7);
  });

  it('rejects an adjustment that would make stock negative', () => {
    expect(stockAfterAdjustment(2, -3)).toBeNull();
  });
});
