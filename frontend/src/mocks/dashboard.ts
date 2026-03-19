export type DashboardRange = 'today' | 'last7' | 'custom';

export const dashboardMock = {
  kpis: {
    salesToday: { value: 12450.0, deltaPct: 12.5 },
    grossProfit: { value: 4120.5, deltaPct: 8.2 },
    unitsSoldToday: { value: 1284, deltaPct: 5.4 },
  },
  dailySalesBars: [
    { day: 'MON', heightPct: 40 },
    { day: 'TUE', heightPct: 60 },
    { day: 'WED', heightPct: 45 },
    { day: 'THU', heightPct: 85 },
    { day: 'FRI', heightPct: 70 },
    { day: 'SAT', heightPct: 100 },
    { day: 'SUN', heightPct: 30 },
  ],
  hourlyTooltip: { label: '14:00', value: 2840.0 },
  payment: {
    total: 842,
    items: [
      { key: 'card', pct: 60, color: 'bg-primary' },
      { key: 'cash', pct: 25, color: 'bg-emerald-500' },
      { key: 'transfer', pct: 15, color: 'bg-slate-300' },
    ],
  },
  products: [
    { name: 'Premium Widget Pro', sold: 452, widthPct: 85, opacity: 1 },
    { name: 'Digital License X', sold: 310, widthPct: 60, opacity: 0.7 },
    { name: 'Basic Support Plan', sold: 185, widthPct: 35, opacity: 0.5 },
    { name: 'Hardware Bundle v2', sold: 92, widthPct: 15, opacity: 0.3 },
  ],
} as const;

export function formatMoneyUSD(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

