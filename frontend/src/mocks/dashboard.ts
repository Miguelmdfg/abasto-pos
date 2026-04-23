// Dashboard mock — usa DEMO_SALES para simular datos reales
export type DashboardRange = 'today' | 'last7' | 'custom';

export function formatMoneyUSD(value: number): string {
  return `$${(value / 36).toFixed(2)} USD`;
}
