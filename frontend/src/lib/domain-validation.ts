export function paymentsMatchTotal(amountsBs: number[], totalBs: number, tolerance = 0.01): boolean {
  if (!Number.isFinite(totalBs) || totalBs < 0) return false;
  if (amountsBs.length === 0 || amountsBs.some((amount) => !Number.isFinite(amount) || amount <= 0)) return false;
  const paid = amountsBs.reduce((sum, amount) => sum + amount, 0);
  return Math.abs(paid - totalBs) <= tolerance;
}

export function stockAfterAdjustment(currentStock: number, adjustment: number): number | null {
  if (!Number.isFinite(currentStock) || !Number.isFinite(adjustment)) return null;
  const nextStock = currentStock + adjustment;
  return nextStock < 0 ? null : nextStock;
}
