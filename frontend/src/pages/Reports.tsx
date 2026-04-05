import { Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useExchangeRate } from '../lib/exchange-rate';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

type Sale = {
  id: number;
  fecha?: string;
  metodo?: string;
  total?: number;
  productos?: SaleItem[] | string;
  referencia?: string;
  banco?: string;
  monto_efectivo?: number;
  moneda_efectivo?: 'bs' | 'usd';
};

type SaleItem = {
  id?: number;
  name?: string;
  qty?: number;
  quantity?: number;
};

type Product = {
  id: number;
  name?: string;
  price?: number;
};

type Tab = 'resumen' | 'pagomovil';

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
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  pagomovil: 'Pago Móvil',
  mixto: 'Mixto',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SALES: Sale[] = [
  { id: 1, fecha: new Date(Date.now() - 3600000).toISOString(), metodo: 'efectivo', total: 450, productos: [{ id: 1, name: 'Arroz 1kg', qty: 3 }, { id: 2, name: 'Aceite 1L', qty: 2 }] },
  { id: 2, fecha: new Date(Date.now() - 7200000).toISOString(), metodo: 'pagomovil', total: 1200, referencia: '123456', banco: 'Banesco', productos: [{ id: 3, name: 'Harina PAN', qty: 5 }] },
  { id: 3, fecha: new Date(Date.now() - 86400000).toISOString(), metodo: 'tarjeta', total: 800, productos: [{ id: 4, name: 'Leche 1L', qty: 4 }] },
  { id: 4, fecha: new Date(Date.now() - 172800000).toISOString(), metodo: 'mixto', total: 2000, referencia: '654321', banco: 'Mercantil', monto_efectivo: 500, moneda_efectivo: 'bs', productos: [{ id: 5, name: 'Pasta 500g', qty: 6 }, { id: 1, name: 'Arroz 1kg', qty: 2 }] },
  { id: 5, fecha: new Date(Date.now() - 259200000).toISOString(), metodo: 'efectivo', total: 350, productos: [{ id: 2, name: 'Aceite 1L', qty: 1 }] },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Arroz 1kg', price: 90 },
  { id: 2, name: 'Aceite 1L', price: 175 },
  { id: 3, name: 'Harina PAN', price: 240 },
  { id: 4, name: 'Leche 1L', price: 200 },
  { id: 5, name: 'Pasta 500g', price: 130 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const { rate } = useExchangeRate();
  const [tab, setTab] = useState<Tab>('resumen');
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [filterMetodo, setFilterMetodo] = useState<string>('all');

  useEffect(() => { void loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [salesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/sales`),
        fetch(`${API_BASE}/products`),
      ]);
      if (!salesRes.ok || !productsRes.ok) throw new Error('api');
      const salesData = (await salesRes.json()) as Sale[];
      const productsData = (await productsRes.json()) as Product[];
      setSales(Array.isArray(salesData) ? salesData : MOCK_SALES);
      setProducts(Array.isArray(productsData) ? productsData : MOCK_PRODUCTS);
      setIsFallback(false);
    } catch {
      setSales(MOCK_SALES);
      setProducts(MOCK_PRODUCTS);
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  }

  const totalGanancias = useMemo(() => sales.reduce((acc, s) => acc + (s.total ?? 0), 0), [sales]);
  const pagoMovilSales = useMemo(() => sales.filter((s) => s.metodo === 'pagomovil' || s.metodo === 'mixto'), [sales]);

  const topProducts = useMemo(() => {
    const counter: Record<number, { name: string; qty: number }> = {};
    for (const sale of sales) {
      for (const item of parseSaleItems(sale.productos)) {
        const pid = item.id ?? 0;
        const qty = item.qty ?? item.quantity ?? 0;
        const name = item.name ?? products.find((p) => p.id === pid)?.name ?? `#${pid}`;
        if (!counter[pid]) counter[pid] = { name, qty: 0 };
        counter[pid].qty += qty;
      }
    }
    return Object.values(counter).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales, products]);

  const maxQty = topProducts[0]?.qty ?? 1;

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sale of sales) {
      const key = sale.metodo ?? 'otro';
      map[key] = (map[key] ?? 0) + (sale.total ?? 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (filterMetodo === 'all') return sales;
    return sales.filter((s) => s.metodo === filterMetodo);
  }, [sales, filterMetodo]);

  const metodos = useMemo(() => Array.from(new Set(sales.map((s) => s.metodo ?? 'otro'))), [sales]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner size="sm" />
        <p className="text-sm text-slate-500">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reportes</h2>
        <p className="text-sm text-slate-500">Historial de ventas, ganancias, productos y pagos móviles.</p>
      </div>

      {isFallback && (
        <Card className="border border-warning/40 bg-warning/5">
          <Card.Content className="p-3 text-xs font-semibold text-warning">
            Mostrando datos de demostración porque la API no está disponible.
          </Card.Content>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {(['resumen', 'pagomovil'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t === 'resumen' ? 'Resumen General' : 'Pagos Móviles'}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {tab === 'resumen' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Ganancias totales acumuladas', main: moneyBs(totalGanancias), sub: rate > 0 ? moneyUsd(totalGanancias / rate) : '—' },
              { label: 'Total de ventas', main: String(sales.length), sub: 'transacciones registradas' },
              { label: 'Pagos móviles / mixtos', main: String(pagoMovilSales.length), sub: 'transacciones con referencia' },
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
              <p className="text-sm font-semibold text-slate-400">📋 Cierres de caja — disponible cuando se implemente el módulo de caja</p>
            </Card.Content>
          </Card>
          <Card className="border border-dashed border-slate-300 dark:border-slate-700">
            <Card.Content className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-400">🏭 Proveedores — disponible cuando se implemente el módulo de proveedores</p>
            </Card.Content>
          </Card>
        </div>
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
