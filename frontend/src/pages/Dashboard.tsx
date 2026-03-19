import { Button, Card, Dropdown } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { dashboardMock, formatMoneyUSD, type DashboardRange } from '../mocks/dashboard';

type HourlyMetric = 'transactions' | 'revenue';

function RangeTabs({
  value,
  onChange,
}: {
  value: DashboardRange;
  onChange: (v: DashboardRange) => void;
}) {
  const { t } = useI18n();
  const items: { key: DashboardRange; label: string }[] = [
    { key: 'today', label: t('dashboard.filter.today') },
    { key: 'last7', label: t('dashboard.filter.last7') },
    { key: 'custom', label: t('dashboard.filter.custom') },
  ];

  return (
    <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {items.map((it) => {
        const isActive = it.key === value;
        const cls = isActive ? '' : 'text-slate-600 dark:text-slate-300';
        return (
          <Button
            key={it.key}
            size="sm"
            variant={isActive ? 'primary' : 'tertiary'}
            className={`rounded-md px-4 ${cls}`}
            onPress={() => onChange(it.key)}
          >
            {it.label}
          </Button>
        );
      })}
    </div>
  );
}

function KpiCard({
  title,
  value,
  deltaPct,
}: {
  title: string;
  value: string;
  deltaPct: number;
}) {
  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Card.Content className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-sm font-extrabold">+</span>
          </div>
          <div className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span className="text-[10px]">▲</span>
            <span>+{deltaPct.toFixed(1)}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        </div>
      </Card.Content>
    </Card>
  );
}

export function Dashboard() {
  const { t } = useI18n();
  const [range, setRange] = useState<DashboardRange>('today');
  const [metric, setMetric] = useState<HourlyMetric>('transactions');

  const metricLabel = useMemo(
    () => (metric === 'transactions' ? t('chart.metric.transactions') : t('chart.metric.revenue')),
    [metric, t]
  );

  return (
    <div className="p-6 md:p-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('dashboard.title')}</h2>
            <p className="text-slate-500">{t('dashboard.subtitle')}</p>
          </div>
          <RangeTabs value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <KpiCard
            title={t('kpi.salesToday')}
            value={formatMoneyUSD(dashboardMock.kpis.salesToday.value)}
            deltaPct={dashboardMock.kpis.salesToday.deltaPct}
          />
          <KpiCard
            title={t('kpi.grossProfit')}
            value={formatMoneyUSD(dashboardMock.kpis.grossProfit.value)}
            deltaPct={dashboardMock.kpis.grossProfit.deltaPct}
          />
          <KpiCard
            title={t('kpi.unitsSoldToday')}
            value={dashboardMock.kpis.unitsSoldToday.value.toLocaleString()}
            deltaPct={dashboardMock.kpis.unitsSoldToday.deltaPct}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Card.Header className="flex items-center justify-between px-6 pb-0 pt-6">
              <Card.Title className="text-base font-bold text-slate-900 dark:text-white">
                {t('chart.dailySales')}
              </Card.Title>
              <span className="text-slate-400">⋯</span>
            </Card.Header>
            <Card.Content className="px-6 pb-6 pt-4">
              <div className="flex h-64 items-end justify-between gap-2 px-2">
                {dashboardMock.dailySalesBars.map((bar) => {
                  const isMax = bar.heightPct === 100;
                  return (
                    <div key={bar.day} className="flex w-full flex-col items-center gap-2">
                      <div
                        className={`w-full rounded-t-lg transition-colors ${
                          isMax ? 'bg-primary' : 'bg-primary/20 hover:bg-primary'
                        }`}
                        style={{ height: `${bar.heightPct}%` }}
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          isMax ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                        }`}
                      >
                        {bar.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card.Content>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Card.Header className="flex items-center justify-between px-6 pb-0 pt-6">
              <Card.Title className="text-base font-bold text-slate-900 dark:text-white">
                {t('chart.hourlyTraffic')}
              </Card.Title>
              <Dropdown>
                <Dropdown.Trigger className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                  {metricLabel}
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    aria-label="Hourly metric"
                    selectionMode="single"
                    selectedKeys={[metric]}
                    onSelectionChange={(keys) => {
                      const first = Array.from(keys)[0];
                      if (first === 'transactions' || first === 'revenue') setMetric(first);
                    }}
                  >
                    <Dropdown.Item key="transactions">{t('chart.metric.transactions')}</Dropdown.Item>
                    <Dropdown.Item key="revenue">{t('chart.metric.revenue')}</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </Card.Header>
            <Card.Content className="px-6 pb-6 pt-4">
              <div className="relative h-64 w-full">
                <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#135bec" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#135bec" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,180 C50,160 80,190 120,130 C160,70 200,90 240,40 C280,0 320,120 400,100 L400,200 L0,200 Z"
                    fill="url(#lineGrad)"
                  />
                  <path
                    d="M0,180 C50,160 80,190 120,130 C160,70 200,90 240,40 C280,0 320,120 400,100"
                    fill="none"
                    stroke="#135bec"
                    strokeWidth="3"
                  />
                  <circle cx="240" cy="40" fill="#135bec" r="4" stroke="#fff" strokeWidth="2" />
                </svg>
                <div className="pointer-events-none absolute left-60 top-2 rounded bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg">
                  {dashboardMock.hourlyTooltip.label} - {formatMoneyUSD(dashboardMock.hourlyTooltip.value)} ({metricLabel})
                </div>
                <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400">
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                  <span>00:00</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Card.Header className="px-6 pb-0 pt-6">
              <Card.Title className="text-base font-bold text-slate-900 dark:text-white">
                {t('chart.paymentMethods')}
              </Card.Title>
            </Card.Header>
            <Card.Content className="px-6 pb-6 pt-4">
              <div className="flex h-56 items-center gap-8">
                <div className="relative size-40 shrink-0">
                  <svg className="size-full" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#135bec"
                      strokeDasharray="60 100"
                      strokeDashoffset="25"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#10b981"
                      strokeDasharray="25 100"
                      strokeDashoffset="-35"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {t('chart.payment.total')}
                    </span>
                    <span className="text-lg font-extrabold">{dashboardMock.payment.total}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  {dashboardMock.payment.items.map((it) => (
                    <div key={it.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`size-3 rounded-full ${it.color}`} />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {it.key === 'card'
                            ? 'Credit Card'
                            : it.key === 'cash'
                              ? 'Cash'
                              : 'Transfer'}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{it.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Content>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Card.Header className="flex items-center justify-between px-6 pb-0 pt-6">
              <Card.Title className="text-base font-bold text-slate-900 dark:text-white">
                {t('ranking.title')}
              </Card.Title>
              <Button variant="tertiary" size="sm" className="text-primary">
                {t('ranking.viewAll')}
              </Button>
            </Card.Header>
            <Card.Content className="px-6 pb-6 pt-4">
              <div className="space-y-6">
                {dashboardMock.products.map((p) => (
                  <div key={p.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold">{p.name}</span>
                      <span className="font-medium text-slate-500">{p.sold} sold</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${p.widthPct}%`, opacity: p.opacity }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        <footer className="mt-8 border-t border-slate-200 pt-8 text-center dark:border-slate-800">
          <p className="text-xs font-medium text-slate-400">{t('footer.note')} (range: {range})</p>
        </footer>
      </div>
    </div>
  );
}

