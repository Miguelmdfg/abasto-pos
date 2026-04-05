import { Button, Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useExchangeRate } from '../lib/exchange-rate';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  cost?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moneyBs(v: number) { return `${v.toFixed(2)} Bs`; }
function moneyUsd(v: number, rate: number) { return rate > 0 ? `$${(v / rate).toFixed(2)}` : '—'; }
function pct(v: number) { return `${v.toFixed(1)}%`; }

function getMarginClass(margin: number) {
  if (margin < 0) return 'text-red-600';
  if (margin < 15) return 'text-yellow-600';
  return 'text-green-600';
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Arroz 1kg', category: 'Granos', price: 90, stock: 50, cost: 60 },
  { id: 2, name: 'Aceite 1L', category: 'Aceites', price: 175, stock: 30, cost: 130 },
  { id: 3, name: 'Harina PAN 1kg', category: 'Harinas', price: 240, stock: 45, cost: 180 },
  { id: 4, name: 'Leche 1L', category: 'Lácteos', price: 200, stock: 20, cost: 160 },
  { id: 5, name: 'Pasta 500g', category: 'Pastas', price: 130, stock: 60, cost: 95 },
  { id: 6, name: 'Atún en lata', category: 'Conservas', price: 310, stock: 25, cost: 220 },
  { id: 7, name: 'Café 250g', category: 'Bebidas', price: 420, stock: 15, cost: 390 },
  { id: 8, name: 'Azúcar 1kg', category: 'Endulzantes', price: 110, stock: 40, cost: 75 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Costs() {
  const { rate } = useExchangeRate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'margin' | 'name' | 'price' | 'profit'>('margin');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [costInput, setCostInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Simulador
  const [simPrice, setSimPrice] = useState('');
  const [simCost, setSimCost] = useState('');
  const [simMargin, setSimMargin] = useState('');
  const [simMode, setSimMode] = useState<'from_margin' | 'from_price'>('from_margin');

  useEffect(() => { void loadProducts(); }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('api');
      const data = (await res.json()) as Product[];
      setProducts(Array.isArray(data) ? data : MOCK_PRODUCTS);
      setIsFallback(false);
    } catch {
      setProducts(MOCK_PRODUCTS);
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCost(productId: number) {
    const cost = Number(costInput);
    if (isNaN(cost) || cost < 0) { setSaveMsg('Ingresa un costo válido.'); return; }
    setIsSaving(true);
    setSaveMsg('');
    try {
      await fetch(`${API_BASE}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost }),
      });
    } catch { /* fallback */ } finally {
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, cost } : p));
      setIsSaving(false);
      setEditingId(null);
      setCostInput('');
      setSaveMsg('✅ Costo actualizado.');
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  // ── Computed metrics ──────────────────────────────────────────────────────

  const enriched = useMemo(() => {
    return products.map((p) => {
      const cost = p.cost ?? 0;
      const hasCost = cost > 0;
      const profitUnit = hasCost ? p.price - cost : null;
      const margin = hasCost && p.price > 0 ? ((p.price - cost) / p.price) * 100 : null;
      const profitStock = hasCost ? (p.price - cost) * p.stock : null;
      return { ...p, profitUnit, margin, profitStock, hasCost };
    });
  }, [products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term
      ? enriched.filter((p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
      : enriched;
    return [...base].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'profit') return (b.profitUnit ?? -Infinity) - (a.profitUnit ?? -Infinity);
      return (b.margin ?? -Infinity) - (a.margin ?? -Infinity);
    });
  }, [enriched, query, sortBy]);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const withCost = enriched.filter((p) => p.hasCost);
  const avgMargin = withCost.length > 0
    ? withCost.reduce((a, p) => a + (p.margin ?? 0), 0) / withCost.length
    : 0;
  const totalProfitStock = withCost.reduce((a, p) => a + (p.profitStock ?? 0), 0);
  const negativoCount = withCost.filter((p) => (p.margin ?? 0) < 0).length;

  // ── Simulador ─────────────────────────────────────────────────────────────

  function calcSim() {
    const c = Number(simCost);
    if (isNaN(c) || c <= 0) return;
    if (simMode === 'from_margin') {
      const m = Number(simMargin);
      if (isNaN(m) || m >= 100) return;
      const suggestedPrice = c / (1 - m / 100);
      setSimPrice(suggestedPrice.toFixed(2));
    } else {
      const p = Number(simPrice);
      if (isNaN(p) || p <= 0) return;
      const calculatedMargin = ((p - c) / p) * 100;
      setSimMargin(calculatedMargin.toFixed(1));
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner size="sm" /><p className="text-sm text-slate-500">Cargando costos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Módulo de Costos</h2>
        <p className="text-sm text-slate-500">Rentabilidad, márgenes y ganancias por producto.</p>
      </div>

      {isFallback && (
        <Card className="border border-warning/40 bg-warning/5">
          <Card.Content className="p-3 text-xs font-semibold text-warning">
            Mostrando datos de demostración porque la API no está disponible.
          </Card.Content>
        </Card>
      )}

      {saveMsg && (
        <Card className="border border-success/40 bg-success/5">
          <Card.Content className="p-3 text-sm font-semibold text-success">{saveMsg}</Card.Content>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Margen promedio', main: pct(avgMargin), sub: `${withCost.length} productos con costo`, color: getMarginClass(avgMargin) },
          { label: 'Ganancia potencial en stock', main: moneyBs(totalProfitStock), sub: moneyUsd(totalProfitStock, rate) + ' USD', color: 'text-slate-900 dark:text-white' },
          { label: 'Sin costo definido', main: String(products.length - withCost.length), sub: 'productos pendientes', color: (products.length - withCost.length) > 0 ? 'text-yellow-600' : 'text-slate-900 dark:text-white' },
          { label: 'Margen negativo', main: String(negativoCount), sub: 'productos con pérdida', color: negativoCount > 0 ? 'text-red-600' : 'text-green-600' },
        ].map((k) => (
          <Card key={k.label} className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
            <Card.Content className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className={`mt-1 text-2xl font-extrabold ${k.color}`}>{k.main}</p>
              <p className="text-sm text-slate-500">{k.sub}</p>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* ── Tabla de productos ── */}
        <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Header className="px-4 pb-0 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Card.Title>Rentabilidad por producto</Card.Title>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'margin', label: 'Margen' },
                  { key: 'profit', label: 'Ganancia' },
                  { key: 'price', label: 'Precio' },
                  { key: 'name', label: 'Nombre' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      sortBy === key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card.Header>
          <Card.Content className="p-4 space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Producto</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Precio venta</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Costo</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Ganancia/u</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Margen</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Stock × Ganancia</th>
                    <th className="pb-2 font-semibold text-slate-500">Editar costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-slate-800 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{moneyBs(p.price)}</p>
                        <p className="text-xs text-slate-400">{moneyUsd(p.price, rate)} USD</p>
                      </td>
                      <td className="py-3 pr-3">
                        {p.hasCost ? (
                          <>
                            <p className="font-semibold">{moneyBs(p.cost!)}</p>
                            <p className="text-xs text-slate-400">{moneyUsd(p.cost!, rate)} USD</p>
                          </>
                        ) : (
                          <span className="text-xs text-yellow-600 font-semibold">Sin costo</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {p.profitUnit !== null ? (
                          <span className={`font-bold ${getMarginClass(p.margin ?? 0)}`}>{moneyBs(p.profitUnit)}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 pr-3">
                        {p.margin !== null ? (
                          <span className={`font-bold text-base ${getMarginClass(p.margin)}`}>{pct(p.margin)}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 pr-3">
                        {p.profitStock !== null ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{moneyBs(p.profitStock)}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3">
                        {editingId === p.id ? (
                          <div className="flex gap-1 items-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={costInput}
                              onChange={(e) => setCostInput(e.target.value)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="0.00"
                              autoFocus
                            />
                            <button
                              onClick={() => void saveCost(p.id)}
                              disabled={isSaving}
                              className="rounded-lg bg-primary px-2 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                            >✓</button>
                            <button
                              onClick={() => { setEditingId(null); setCostInput(''); }}
                              className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            >✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(p.id); setCostInput(String(p.cost ?? '')); setSaveMsg(''); }}
                            className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            {p.hasCost ? 'Editar' : '+ Agregar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>

        {/* ── Simulador de precio ── */}
        <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 h-fit">
          <Card.Header className="px-4 pb-0 pt-4">
            <Card.Title>🧮 Simulador de precio</Card.Title>
          </Card.Header>
          <Card.Content className="p-4 space-y-4">
            <p className="text-xs text-slate-500">Calcula el precio sugerido a partir de un margen deseado, o calcula el margen real a partir de un precio.</p>

            <div className="flex gap-2">
              {([
                { key: 'from_margin', label: 'Precio → desde margen' },
                { key: 'from_price', label: 'Margen → desde precio' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setSimMode(key); setSimPrice(''); setSimMargin(''); }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                    simMode === key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Costo unitario (Bs)</label>
                <input
                  type="number" min="0" step="0.01" value={simCost}
                  onChange={(e) => setSimCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {simMode === 'from_margin' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Margen deseado (%)</label>
                  <input
                    type="number" min="0" max="99" step="0.1" value={simMargin}
                    onChange={(e) => setSimMargin(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Precio de venta (Bs)</label>
                  <input
                    type="number" min="0" step="0.01" value={simPrice}
                    onChange={(e) => setSimPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <button
                onClick={calcSim}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90"
              >
                Calcular
              </button>
            </div>

            {/* Resultado simulador */}
            {simCost && (simMode === 'from_margin' ? simPrice : simMargin) && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Resultado</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Costo:</span>
                  <span className="font-semibold">{moneyBs(Number(simCost))}</span>
                </div>
                {simMode === 'from_margin' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Margen objetivo:</span>
                      <span className="font-semibold">{pct(Number(simMargin))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Precio sugerido:</span>
                      <span className="text-lg font-extrabold text-primary">{moneyBs(Number(simPrice))}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>En USD:</span>
                      <span>{moneyUsd(Number(simPrice), rate)} USD</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Precio ingresado:</span>
                      <span className="font-semibold">{moneyBs(Number(simPrice))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Margen real:</span>
                      <span className={`text-lg font-extrabold ${getMarginClass(Number(simMargin))}`}>{pct(Number(simMargin))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Ganancia por unidad:</span>
                      <span className="font-semibold">{moneyBs(Number(simPrice) - Number(simCost))}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
