import { Card } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useExchangeRate } from '../lib/exchange-rate';
import { useSalesHistory } from '../lib/sales-history';
import { loadCatalogProducts, type CatalogProduct } from '../lib/catalog';
import { buildSalesCsv } from '../lib/sales-export';
import { useCashierShift } from '../lib/cashier-shift';
import { buildCashClosuresCsv } from '../lib/cash-closure-export';

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleItem = {
  id?: string | number;
  name?: string;
  qty?: number;
  quantity?: number;
};

type Tab = 'resumen' | 'pagomovil' | 'cierres';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moneyBs(v: number) {
  return `${v.toFixed(2)} Bs`;
}
function moneyUsd(v: number) {
  return `$${v.toFixed(2)} USD`;
}
function fmtDate(fecha?: string) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseSaleItems(raw?: SaleItem[] | string): SaleItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SaleItem[]) : [];
  } catch {
    return [];
  }
}

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  efectivo_bs: 'Efectivo Bs',
  efectivo_usd: 'Efectivo USD',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  pagomovil: 'Pago Móvil',
  pago_movil: 'Pago Móvil',
  punto_venta: 'Punto de venta',
  nota_credito: 'Nota de crédito',
  mixto: 'Mixto',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const { rate } = useExchangeRate();
  const { sales, refreshError, refreshSales } = useSalesHistory();
  const { shifts, shiftsError, refreshShifts } = useCashierShift();
  const [tab, setTab] = useState<Tab>('resumen');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [filterMetodo, setFilterMetodo] = useState<string>('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const refreshProducts = useCallback(async () => {
    try {
      setProducts(await loadCatalogProducts());
      setCatalogError('');
    } catch {
      setCatalogError('No se pudo cargar el catálogo. Los nombres de productos podrían no estar disponibles.');
    }
  }, []);

  useEffect(() => { void refreshProducts(); }, [refreshProducts]);
  useEffect(() => { void refreshShifts(); }, [refreshShifts]);

  const periodSales = useMemo(() => sales.filter((sale) => {
    const timestamp = new Date(sale.fecha).getTime();
    if (!Number.isFinite(timestamp)) return false;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    return (!fechaDesde || day >= fechaDesde) && (!fechaHasta || day <= fechaHasta);
  }), [fechaDesde, fechaHasta, sales]);

  const totalSales = useMemo(() => periodSales.reduce((acc, s) => acc + (s.total ?? 0), 0), [periodSales]);
  const pagoMovilSales = useMemo(
    () => periodSales.filter((sale) => sale.payments?.some((payment) => payment.method === 'pago_movil') || sale.metodo === 'pagomovil' || sale.metodo === 'mixto'),
    [periodSales],
  );

  const topProducts = useMemo(() => {
    const counter: Record<string, { name: string; qty: number }> = {};
    for (const sale of periodSales) {
      for (const item of parseSaleItems(sale.productos)) {
        const pid = String(item.id ?? 0);
        const qty = item.qty ?? item.quantity ?? 0;
        const name = item.name ?? products.find((p) => p.id === pid)?.name ?? `#${pid}`;
        if (!counter[pid]) counter[pid] = { name, qty: 0 };
        counter[pid].qty += qty;
      }
    }
    return Object.values(counter).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [periodSales, products]);

  const maxQty = topProducts[0]?.qty ?? 1;

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sale of periodSales) {
      if (sale.payments?.length) {
        for (const payment of sale.payments) {
          map[payment.method] = (map[payment.method] ?? 0) + payment.amountBs;
        }
      } else {
        map[sale.metodo ?? 'otro'] = (map[sale.metodo ?? 'otro'] ?? 0) + (sale.total ?? 0);
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [periodSales]);

  const filteredSales = useMemo(() => {
    if (filterMetodo === 'all') return periodSales;
    return periodSales.filter((sale) => sale.payments?.length
      ? sale.payments.some((payment) => payment.method === filterMetodo)
      : sale.metodo === filterMetodo);
  }, [periodSales, filterMetodo]);

  const metodos = useMemo(
    () => Array.from(new Set(periodSales.flatMap((sale) => sale.payments?.length ? sale.payments.map((payment) => payment.method) : [sale.metodo ?? 'otro']))),
    [periodSales],
  );
  const filteredShifts = useMemo(() => shifts.filter((shift) => {
    const timestamp = new Date(shift.fecha).getTime();
    if (!Number.isFinite(timestamp)) return false;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    return (!fechaDesde || day >= fechaDesde) && (!fechaHasta || day <= fechaHasta);
  }), [fechaDesde, fechaHasta, shifts]);

  function exportSales() {
    const blob = new Blob([buildSalesCsv(filteredSales)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `abasto-ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportClosures() {
    const blob = new Blob([buildCashClosuresCsv(filteredShifts)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `abasto-cierres-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reportes</h2>
        <p className="text-sm text-slate-500">Historial de ventas, ganancias, productos y pagos móviles.</p>
      </div>

      {(refreshError || catalogError || (tab === 'cierres' && shiftsError)) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <span>{refreshError || catalogError}</span>
          <div className="flex gap-2">
            {refreshError && <button type="button" onClick={() => void refreshSales()} className="font-bold underline">Reintentar ventas</button>}
            {catalogError && <button type="button" onClick={() => void refreshProducts()} className="font-bold underline">Reintentar catálogo</button>}
            {tab === 'cierres' && shiftsError && <button type="button" onClick={() => void refreshShifts()} className="font-bold underline">Reintentar cierres</button>}
          </div>
        </div>
      )}

      <Card className="w-fit max-w-full border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
        <Card.Content className="flex flex-row flex-wrap items-end justify-start gap-3 p-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Desde
            <input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(event) => setFechaDesde(event.target.value)} className="w-40 max-w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Hasta
            <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(event) => setFechaHasta(event.target.value)} className="w-40 max-w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
          <button type="button" onClick={exportSales} disabled={filteredSales.length === 0} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            Exportar CSV ({filteredSales.length})
          </button>
        </Card.Content>
      </Card>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {(['resumen', 'pagomovil', 'cierres'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t === 'resumen' ? 'Resumen General' : t === 'pagomovil' ? 'Pagos Móviles' : 'Cierres de caja'}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {tab === 'resumen' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Ventas totales', main: moneyBs(totalSales), sub: rate > 0 ? moneyUsd(totalSales / rate) : '—' },
              { label: 'Total de ventas', main: String(periodSales.length), sub: 'transacciones registradas' },
              { label: 'Ventas con pago móvil/mixto', main: String(pagoMovilSales.length), sub: 'transacciones registradas' },
            ].map((kpi) => (
              <Card key={kpi.label} className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
                <Card.Content className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{kpi.main}</p>
                  <p className="text-sm text-slate-500">{kpi.sub}</p>
                </Card.Content>
              </Card>
            ))}
          </div>

          {/* Productos destacados + métodos de pago */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
              <Card.Header className="px-4 pb-0 pt-4"><Card.Title>Productos más vendidos</Card.Title></Card.Header>
              <Card.Content className="p-4 space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin datos.</p>
                ) : (
                  topProducts.map((p, i) => (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{i + 1}. {p.name}</span>
                        <span className="text-slate-500">{p.qty} uds.</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </Card.Content>
            </Card>

            <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
              <Card.Header className="px-4 pb-0 pt-4"><Card.Title>Ventas por método de pago</Card.Title></Card.Header>
              <Card.Content className="p-4 space-y-3">
                {paymentBreakdown.map(([metodo, total]) => (
                  <div key={metodo} className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {METODO_LABEL[metodo] ?? metodo}
                    </span>
                    <div className="text-right">
                      <p className="font-bold">{moneyBs(total)}</p>
                      <p className="text-xs text-slate-500">{rate > 0 ? moneyUsd(total / rate) : '—'}</p>
                    </div>
                  </div>
                ))}
              </Card.Content>
            </Card>
          </div>

          {/* Historial de ventas */}
          <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
            <Card.Header className="px-4 pb-0 pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Card.Title>Historial de ventas</Card.Title>
                <div className="flex gap-2 flex-wrap">
                  {['all', ...metodos].map((m) => (
                    <button
                      key={m}
                      onClick={() => setFilterMetodo(m)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        filterMetodo === m
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {m === 'all' ? 'Todos' : (METODO_LABEL[m] ?? m)}
                    </button>
                  ))}
                </div>
              </div>
            </Card.Header>
            <Card.Content className="p-4">
              {filteredSales.length === 0 ? (
                <p className="text-sm text-slate-500">No hay ventas para mostrar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                        <th className="pb-2 font-semibold text-slate-500 pr-4">#</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Fecha</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Método</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Productos</th>
                        <th className="pb-2 font-semibold text-slate-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredSales.map((sale) => {
                        const items = parseSaleItems(sale.productos);
                        return (
                          <tr key={sale.id}>
                            <td className="py-3 pr-4 text-slate-400">{sale.id}</td>
                            <td className="py-3 pr-4 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmtDate(sale.fecha)}</td>
                            <td className="py-3 pr-4">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                sale.metodo === 'pagomovil' || sale.metodo === 'mixto'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                  : sale.metodo === 'efectivo'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {METODO_LABEL[sale.metodo ?? ''] ?? sale.metodo ?? '—'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                              {items.length > 0
                                ? items.map((it) => `${it.name ?? `#${it.id}`} x${it.qty ?? it.quantity ?? 1}`).join(', ')
                                : '—'}
                            </td>
                            <td className="py-3 text-right">
                              <p className="font-bold text-slate-900 dark:text-white">{moneyBs(sale.total ?? 0)}</p>
                              <p className="text-xs text-slate-500">{rate > 0 ? moneyUsd((sale.total ?? 0) / rate) : '—'}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Placeholders */}
          <Card className="border border-dashed border-slate-300 dark:border-slate-700">
            <Card.Content className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-400">📋 Resumen y exportación de cierres de caja — pendiente</p>
            </Card.Content>
          </Card>
          <Card className="border border-dashed border-slate-300 dark:border-slate-700">
            <Card.Content className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-400">🏭 Proveedores — disponible cuando se implemente el módulo de proveedores</p>
            </Card.Content>
          </Card>
        </div>
      )}

      {tab === 'cierres' && (
        <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Header className="flex flex-row items-center justify-between gap-3 px-4 pb-0 pt-4">
            <div>
              <Card.Title>Cierres de caja</Card.Title>
              <p className="text-xs text-slate-500">{filteredShifts.length} cierres en el período seleccionado</p>
            </div>
            <button type="button" onClick={exportClosures} disabled={filteredShifts.length === 0} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Exportar CSV
            </button>
          </Card.Header>
          <Card.Content className="p-4">
            {filteredShifts.length === 0 ? (
              <p className="text-sm text-slate-500">No hay cierres para mostrar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                      <th className="pb-2 pr-4 font-semibold text-slate-500">Código</th>
                      <th className="pb-2 pr-4 font-semibold text-slate-500">Fecha</th>
                      <th className="pb-2 pr-4 font-semibold text-slate-500">Cajero</th>
                      <th className="pb-2 pr-4 text-right font-semibold text-slate-500">Ventas Bs</th>
                      <th className="pb-2 pr-4 text-right font-semibold text-slate-500">Contado Bs</th>
                      <th className="pb-2 text-right font-semibold text-slate-500">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredShifts.map((shift) => (
                      <tr key={shift.id}>
                        <td className="py-3 pr-4 font-mono text-xs">{shift.id}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(shift.fecha)}</td>
                        <td className="py-3 pr-4">{shift.cajero}</td>
                        <td className="py-3 pr-4 text-right">{moneyBs(shift.totalVenta)}</td>
                        <td className="py-3 pr-4 text-right">{moneyBs(shift.totalCaja)}</td>
                        <td className="py-3 text-right">{moneyBs(shift.diferencia)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* ── TAB: PAGOS MÓVILES ── */}
      {tab === 'pagomovil' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total recibido (Pago Móvil)', main: moneyBs(pagoMovilSales.reduce((a, s) => a + (s.total ?? 0), 0)), sub: rate > 0 ? moneyUsd(pagoMovilSales.reduce((a, s) => a + (s.total ?? 0), 0) / rate) : '—' },
              { label: 'Transacciones', main: String(pagoMovilSales.length), sub: 'pago móvil y mixto' },
              { label: 'Con pago mixto', main: String(pagoMovilSales.filter((s) => s.metodo === 'mixto').length), sub: 'efectivo + pago móvil' },
            ].map((kpi) => (
              <Card key={kpi.label} className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
                <Card.Content className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{kpi.main}</p>
                  <p className="text-sm text-slate-500">{kpi.sub}</p>
                </Card.Content>
              </Card>
            ))}
          </div>

          <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
            <Card.Header className="px-4 pb-0 pt-4"><Card.Title>Registro de pagos móviles</Card.Title></Card.Header>
            <Card.Content className="p-4">
              {pagoMovilSales.length === 0 ? (
                <p className="text-sm text-slate-500">No hay pagos móviles registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Venta #</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Fecha</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Tipo</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Referencia</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Banco</th>
                        <th className="pb-2 font-semibold text-slate-500 pr-4">Monto PM</th>
                        <th className="pb-2 font-semibold text-slate-500">Efectivo adicional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pagoMovilSales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="py-3 pr-4 text-slate-400">{sale.id}</td>
                          <td className="py-3 pr-4 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmtDate(sale.fecha)}</td>
                          <td className="py-3 pr-4">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              sale.metodo === 'mixto'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}>
                              {sale.metodo === 'mixto' ? 'Mixto' : 'Pago Móvil'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-mono text-slate-700 dark:text-slate-300">
                            {sale.referencia ? `···${sale.referencia}` : '—'}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{sale.banco ?? '—'}</td>
                          <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{moneyBs(sale.total ?? 0)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {sale.metodo === 'mixto' && sale.monto_efectivo != null
                              ? `${sale.monto_efectivo.toFixed(2)} ${sale.moneda_efectivo === 'usd' ? 'USD' : 'Bs'}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
