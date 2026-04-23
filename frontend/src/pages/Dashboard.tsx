import { Card, Dropdown } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useExchangeRate } from '../lib/exchange-rate';
import { useSalesHistory } from '../lib/sales-history';
import { DEMO_SALES } from '../mocks/demo-data';

type DashboardRange = 'today' | 'last7' | 'custom';

function moneyBs(v: number) { return `${v.toFixed(0)} Bs`; }
function moneyUsdFromBs(vBs: number, rate: number) { return `$${(rate > 0 ? vBs / rate : 0).toFixed(2)}`; }

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

// ─── Mini bar chart SVG ───────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map(({ label, value }) => {
        const pct = (value / max) * 100;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1" title={`${label}: ${moneyBs(value)}`}>
            <div
              className="w-full rounded-t-sm bg-primary/80 transition-all duration-500 hover:bg-primary"
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            <span className="text-[9px] text-slate-400 truncate w-full text-center">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hourly sparkline ─────────────────────────────────────────────────────────

function HourlyChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 280;
    const y = 50 - (d.value / max) * 44;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <div className="w-full">
      <svg viewBox="0 0 280 56" className="w-full h-14" preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="rgb(99,102,241)" strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 280;
          const y = 50 - (d.value / max) * 44;
          return <circle key={i} cx={x} cy={y} r="2.5" fill="rgb(99,102,241)" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.filter((_, i) => i % 2 === 0).map(d => (
          <span key={d.label} className="text-[9px] text-slate-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { t } = useI18n();
  const { sales: liveSales } = useSalesHistory();
  const { rate } = useExchangeRate();
  const [range, setRange] = useState<DashboardRange>('last7');

  // Combina ventas reales + demo (demo primero si no hay reales)
  const allSales = useMemo(() => {
    const combined = [...liveSales, ...DEMO_SALES];
    // Deduplica por id
    const seen = new Set<string>();
    return combined.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
  }, [liveSales]);

  // Filtra por rango
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    return allSales.filter(s => {
      const d = new Date(s.fecha);
      if (range === 'today') return d >= todayStart;
      if (range === 'last7') return d >= new Date(todayStart.getTime() - 6 * 86400000);
      return true;
    });
  }, [allSales, range]);

  // KPIs
  const kpis = useMemo(() => ({
    totalBs: filteredSales.reduce((a, s) => a + s.total, 0),
    transacciones: filteredSales.length,
    unidades: filteredSales.reduce((a, s) => a + s.productos.reduce((b, p) => b + p.qty, 0), 0),
    cajeros: new Set(filteredSales.map(s => s.cajero)).size,
  }), [filteredSales]);

  // Ventas diarias (últimos 7 días)
  const dailyBars = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfDay(new Date()).getTime() - i * 86400000);
      const label = d.toLocaleDateString('es-VE', { weekday: 'short', day: '2-digit' });
      const value = filteredSales
        .filter(s => {
          const sd = new Date(s.fecha);
          return sd >= d && sd < new Date(d.getTime() + 86400000);
        })
        .reduce((a, s) => a + s.total, 0);
      days.push({ label, value });
    }
    return days;
  }, [filteredSales]);

  // Tráfico por hora (simulado desde ventas reales)
  const hourlyData = useMemo(() => {
    const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const buckets: Record<number, number> = {};
    hours.forEach(h => { buckets[h] = 0; });
    filteredSales.forEach(s => {
      const h = new Date(s.fecha).getHours();
      if (buckets[h] !== undefined) buckets[h] += s.total;
    });
    // Si no hay datos reales, simula una curva típica de tienda
    const hasData = Object.values(buckets).some(v => v > 0);
    if (!hasData) {
      const curve = [120, 180, 350, 620, 890, 1100, 980, 750, 680, 920, 1050, 870, 540, 280];
      hours.forEach((h, i) => { buckets[h] = curve[i]; });
    }
    return hours.map(h => ({ label: `${h}:00`, value: buckets[h] }));
  }, [filteredSales]);

  // Métodos de pago
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => { map[s.metodo] = (map[s.metodo] ?? 0) + s.total; });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    const colors: Record<string, string> = {
      pagomovil: 'bg-blue-500', efectivo_bs: 'bg-green-500', efectivo_usd: 'bg-emerald-500',
      tarjeta: 'bg-purple-500', punto_venta: 'bg-indigo-500', mixto: 'bg-orange-500', fiado: 'bg-red-400',
    };
    const labels: Record<string, string> = {
      pagomovil: 'Pago Móvil', efectivo_bs: 'Efectivo Bs', efectivo_usd: 'Efectivo USD',
      tarjeta: 'Tarjeta', punto_venta: 'Punto Venta', mixto: 'Mixto', fiado: 'Fiado',
    };
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([key, val]) => ({
        label: labels[key] ?? key,
        pct: Math.round((val / total) * 100),
        color: colors[key] ?? 'bg-slate-400',
        monto: val,
      }));
  }, [filteredSales]);

  // Top productos
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      s.productos.forEach(p => {
        if (!map[p.name]) map[p.name] = { name: p.name, qty: 0, revenue: 0 };
        map[p.name].qty += p.qty;
        map[p.name].revenue += p.qty * p.price;
      });
    });
    const sorted = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8);
    const maxQty = sorted[0]?.qty || 1;
    return sorted.map(p => ({ ...p, pct: Math.round((p.qty / maxQty) * 100) }));
  }, [filteredSales]);

  const rangeLabels: Record<DashboardRange, string> = {
    today: t('dashboard.filter.today'),
    last7: t('dashboard.filter.last7'),
    custom: t('dashboard.filter.custom'),
  };

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('dashboard.title')}
          </h2>
          <p className="text-sm text-slate-500">{t('dashboard.subtitle')}</p>
        </div>
        <Dropdown>
          <Dropdown.Trigger className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200">
            📅 {rangeLabels[range]}
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu
              aria-label="Range"
              selectionMode="single"
              selectedKeys={[range]}
              onSelectionChange={keys => {
                const k = Array.from(keys)[0] as DashboardRange;
                if (k) setRange(k);
              }}
            >
              <Dropdown.Item key="today">{t('dashboard.filter.today')}</Dropdown.Item>
              <Dropdown.Item key="last7">{t('dashboard.filter.last7')}</Dropdown.Item>
              <Dropdown.Item key="custom">Todos los datos</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Ventas totales', value: moneyUsdFromBs(kpis.totalBs, rate), sub: moneyBs(kpis.totalBs), icon: '💰' },
          { label: 'Transacciones', value: String(kpis.transacciones), sub: 'ventas registradas', icon: '🧾' },
          { label: 'Unidades vendidas', value: String(kpis.unidades), sub: 'productos despachados', icon: '📦' },
          { label: 'Cajeros activos', value: String(kpis.cajeros), sub: 'en el período', icon: '👤' },
        ].map(kpi => (
          <Card key={kpi.label} className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Card.Content className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{kpi.value}</p>
                  <p className="text-xs text-slate-400">{kpi.sub}</p>
                </div>
                <span className="text-2xl">{kpi.icon}</span>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Gráficas principales */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Ventas diarias */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Card.Header className="px-5 pb-0 pt-5">
            <div>
              <Card.Title>Ventas diarias</Card.Title>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 7 días en Bs</p>
            </div>
          </Card.Header>
          <Card.Content className="px-5 pb-5 pt-3">
            <BarChart data={dailyBars} />
            <p className="mt-2 text-right text-xs font-semibold text-slate-400">
              Total 7 días: {moneyBs(dailyBars.reduce((a, d) => a + d.value, 0))}
            </p>
          </Card.Content>
        </Card>

        {/* Tráfico por hora */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Card.Header className="px-5 pb-0 pt-5">
            <div>
              <Card.Title>Tráfico por hora</Card.Title>
              <p className="text-xs text-slate-400 mt-0.5">Ingresos estimados por franja horaria</p>
            </div>
          </Card.Header>
          <Card.Content className="px-5 pb-5 pt-3">
            <HourlyChart data={hourlyData} />
          </Card.Content>
        </Card>
      </div>

      {/* Métodos de pago + Top productos */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Métodos de pago */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Card.Header className="px-5 pb-0 pt-5">
            <Card.Title>Métodos de pago</Card.Title>
          </Card.Header>
          <Card.Content className="p-5 space-y-3">
            {paymentBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos en este período.</p>
            ) : paymentBreakdown.map(pm => (
              <div key={pm.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{pm.label}</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">{pm.pct}%</span>
                    <span className="ml-2 text-xs text-slate-400">{moneyBs(pm.monto)}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-2 rounded-full ${pm.color} transition-all duration-700`} style={{ width: `${pm.pct}%` }} />
                </div>
              </div>
            ))}
          </Card.Content>
        </Card>

        {/* Top productos */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Card.Header className="px-5 pb-0 pt-5">
            <Card.Title>🏆 Productos más vendidos</Card.Title>
          </Card.Header>
          <Card.Content className="p-5 space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos en este período.</p>
            ) : topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-1.5 rounded-full bg-primary/60 transition-all duration-700" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.qty} uds</p>
                  <p className="text-xs text-slate-400">{moneyBs(p.revenue)}</p>
                </div>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>

      {/* Ventas recientes */}
      <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Card.Header className="px-5 pb-0 pt-5">
          <Card.Title>Ventas recientes</Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSales.slice(0, 6).map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div>
                  <p className="font-mono text-xs font-bold text-slate-500">{s.id}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(s.fecha).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{s.cajero}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">{moneyBs(s.total)}</p>
                  <p className="text-xs text-slate-400">{s.productos.length} producto{s.productos.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

    </div>
  );
}
