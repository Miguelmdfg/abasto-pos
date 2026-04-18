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
  cost_usd?: number;
  units_per_bundle?: number;
  cost_per_bundle_usd?: number;
};

type EnrichedProduct = Product & {
  hasCost: boolean;
  unitCostUsd: number;
  unitCostBcv: number;
  unitCostParallel: number;
  price30Bcv: number;
  priceAvg: number;
  price30Parallel: number;
  gainPctBcv: number;
  gainPctParallel: number;
  gainUnitUsd: number;
  gainBundleUsd: number;
  gainBs: number;
  profitUnit: number | null;
  margin: number | null;
  profitStock: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moneyBs(v: number) { return `${v.toFixed(2)} Bs`; }
function moneyUsd(v: number) { return `$${v.toFixed(2)}`; }
function pct(v: number) { return `${v.toFixed(1)}%`; }

function getMarginClass(margin: number) {
  if (margin < 0) return 'text-red-600';
  if (margin < 15) return 'text-yellow-600';
  return 'text-green-600';
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Arroz 1kg', category: 'Granos', price: 90, stock: 50, cost: 60, cost_usd: 2, units_per_bundle: 20, cost_per_bundle_usd: 40 },
  { id: 2, name: 'Aceite 1L', category: 'Aceites', price: 175, stock: 30, cost: 130, cost_usd: 3.5, units_per_bundle: 12, cost_per_bundle_usd: 42 },
  { id: 3, name: 'Harina PAN 1kg', category: 'Harinas', price: 240, stock: 45, cost: 180, cost_usd: 5, units_per_bundle: 24, cost_per_bundle_usd: 120 },
  { id: 4, name: 'Leche 1L', category: 'Lácteos', price: 200, stock: 20, cost: 160, cost_usd: 4, units_per_bundle: 12, cost_per_bundle_usd: 48 },
  { id: 5, name: 'Pasta 500g', category: 'Pastas', price: 130, stock: 60, cost: 95, cost_usd: 1.5, units_per_bundle: 30, cost_per_bundle_usd: 45 },
  { id: 6, name: 'Atún en lata', category: 'Conservas', price: 310, stock: 25, cost: 220, cost_usd: 6, units_per_bundle: 24, cost_per_bundle_usd: 144 },
  { id: 7, name: 'Café 250g', category: 'Bebidas', price: 420, stock: 15, cost: 390, cost_usd: 9, units_per_bundle: 12, cost_per_bundle_usd: 108 },
  { id: 8, name: 'Azúcar 1kg', category: 'Endulzantes', price: 110, stock: 40, cost: 75, cost_usd: 1.8, units_per_bundle: 20, cost_per_bundle_usd: 36 },
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  
  // Form state for cost editing modal
  const [formData, setFormData] = useState<{
    cost: string;
    cost_usd: string;
    units_per_bundle: string;
    cost_per_bundle_usd: string;
  }>({ cost: '', cost_usd: '', units_per_bundle: '', cost_per_bundle_usd: '' });

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

  function openEditModal(product: Product) {
    setEditingId(product.id);
    setFormData({
      cost: String(product.cost ?? ''),
      cost_usd: String(product.cost_usd ?? ''),
      units_per_bundle: String(product.units_per_bundle ?? ''),
      cost_per_bundle_usd: String(product.cost_per_bundle_usd ?? ''),
    });
    setSaveMsg('');
  }

  async function saveCost(productId: number) {
    const cost = Number(formData.cost);
    const costUsd = Number(formData.cost_usd) || 0;
    const unitsPerBundle = Number(formData.units_per_bundle) || 1;
    const costPerBundleUsd = Number(formData.cost_per_bundle_usd) || 0;
    
    if (isNaN(cost) || cost < 0) { setSaveMsg('Ingresa un costo válido.'); return; }
    
    setIsSaving(true);
    setSaveMsg('');
    try {
      await fetch(`${API_BASE}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cost, 
          cost_usd: costUsd, 
          units_per_bundle: unitsPerBundle, 
          cost_per_bundle_usd: costPerBundleUsd 
        }),
      });
    } catch { /* fallback */ } finally {
      setProducts((prev) => prev.map((p) => 
        p.id === productId 
          ? { ...p, cost, cost_usd: costUsd, units_per_bundle: unitsPerBundle, cost_per_bundle_usd: costPerBundleUsd } 
          : p
      ));
      setIsSaving(false);
      setEditingId(null);
      setFormData({ cost: '', cost_usd: '', units_per_bundle: '', cost_per_bundle_usd: '' });
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

      // New cost structure calculations
      const costUsd = p.cost_usd ?? 0;
      const unitsPerBundle = p.units_per_bundle ?? 1;
      const costPerBundleUsd = p.cost_per_bundle_usd ?? 0;
      
      // Calculate unit cost in USD (from bundle or direct)
      const unitCostUsd = costPerBundleUsd > 0 && unitsPerBundle > 0 
        ? costPerBundleUsd / unitsPerBundle 
        : (costUsd > 0 ? costUsd : 0);
      
      // Cost at different exchange rates
      const rateBcv = rate;
      const rateParallel = rate * 1.1; // 10% higher as parallel rate
      const unitCostBcv = unitCostUsd * rateBcv;
      const unitCostParallel = unitCostUsd * rateParallel;
      
      // Price suggestions with 30% margin
      const price30Bcv = unitCostBcv / (1 - 0.30);
      const priceAvg = p.price; // Current selling price
      const price30Parallel = unitCostParallel / (1 - 0.30);
      
      // Gain percentages
      const gainPctBcv = p.price > 0 ? ((p.price - unitCostBcv) / unitCostBcv) * 100 : 0;
      const gainPctParallel = p.price > 0 ? ((p.price - unitCostParallel) / unitCostParallel) * 100 : 0;
      
      // Gains in different formats
      const priceUsd = rate > 0 ? p.price / rate : 0;
      const gainUnitUsd = priceUsd - unitCostUsd;
      const gainBundleUsd = gainUnitUsd * unitsPerBundle;
      const gainBs = gainUnitUsd * rate;

      return { 
        ...p, 
        profitUnit, 
        margin, 
        profitStock, 
        hasCost,
        unitCostUsd,
        unitCostBcv,
        unitCostParallel,
        price30Bcv,
        priceAvg,
        price30Parallel,
        gainPctBcv,
        gainPctParallel,
        gainUnitUsd,
        gainBundleUsd,
        gainBs,
      };
    });
  }, [products, rate]);

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
              <table className="w-full text-sm min-w-[1400px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                    <th className="pb-2 font-semibold text-slate-500 pr-3 sticky left-0 bg-white dark:bg-slate-900 z-10">Producto</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Precio venta</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Unid. x Bulto</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Costo Bulto USD</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Precio U. USD</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Costo U. BCV</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Costo U. Paralelo</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">30% BCV</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">% Prom.</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">30% Paralelo</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">%Gan BCV</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">%Gan Paralelo</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Ganancia U$</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Ganancia Bulto</th>
                    <th className="pb-2 font-semibold text-slate-500 pr-3">Ganancia Bs</th>
                    <th className="pb-2 font-semibold text-slate-500">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((p: EnrichedProduct) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 pr-3 sticky left-0 bg-white dark:bg-slate-900 z-0">
                        <p className="font-semibold text-slate-800 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{moneyBs(p.price)}</p>
                        <p className="text-xs text-slate-400">${(p.price / rate).toFixed(2)} USD</p>
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <span className="font-medium">{p.units_per_bundle ?? '-'}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-medium">{p.cost_per_bundle_usd ? `$${p.cost_per_bundle_usd.toFixed(2)}` : '-'}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`font-bold ${!p.unitCostUsd ? 'text-yellow-600' : ''}`}>
                          {p.unitCostUsd ? `$${p.unitCostUsd.toFixed(3)}` : '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-slate-700 dark:text-slate-300">{p.unitCostBcv ? moneyBs(p.unitCostBcv) : '-'}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-slate-700 dark:text-slate-300">{p.unitCostParallel ? moneyBs(p.unitCostParallel) : '-'}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-semibold text-blue-600">{p.unitCostBcv ? moneyBs(p.price30Bcv) : '-'}</span>
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <span className="font-semibold text-purple-600">{p.unitCostBcv ? pct(((p.price - p.unitCostBcv) / p.price) * 100) : '-'}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-semibold text-orange-600">{p.unitCostParallel ? moneyBs(p.price30Parallel) : '-'}</span>
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <span className={`font-bold ${p.gainPctBcv < 0 ? 'text-red-600' : p.gainPctBcv < 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {p.unitCostBcv ? pct(p.gainPctBcv) : '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <span className={`font-bold ${p.gainPctParallel < 0 ? 'text-red-600' : p.gainPctParallel < 15 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {p.unitCostParallel ? pct(p.gainPctParallel) : '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`font-bold ${p.gainUnitUsd < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {p.unitCostUsd ? `$${p.gainUnitUsd.toFixed(3)}` : '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`font-semibold ${p.gainBundleUsd < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {p.unitCostUsd ? `$${p.gainBundleUsd.toFixed(2)}` : '-'}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`font-semibold ${p.gainBs < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {p.unitCostUsd ? moneyBs(p.gainBs) : '-'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {p.hasCost ? 'Editar' : '+ Costo'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal de edición de costos */}
            {editingId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <Card className="w-full max-w-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <Card.Header className="px-4 pb-0 pt-4">
                    <Card.Title className="text-lg">✏️ Editar Costos del Producto</Card.Title>
                  </Card.Header>
                  <Card.Content className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Costo en Bs (campo legacy)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Unidades x Bulto
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={formData.units_per_bundle}
                          onChange={(e) => setFormData({ ...formData, units_per_bundle: e.target.value })}
                          placeholder="20"
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Costo Bulto USD
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.cost_per_bundle_usd}
                          onChange={(e) => setFormData({ ...formData, cost_per_bundle_usd: e.target.value })}
                          placeholder="40.00"
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Costo Unitario USD (opcional, si no usa bulto)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={formData.cost_usd}
                        onChange={(e) => setFormData({ ...formData, cost_usd: e.target.value })}
                        placeholder="2.000"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {saveMsg && (
                      <p className="text-sm font-semibold text-success">{saveMsg}</p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => saveCost(editingId)}
                        disabled={isSaving}
                        className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        {isSaving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setFormData({ cost: '', cost_usd: '', units_per_bundle: '', cost_per_bundle_usd: '' }); }}
                        className="flex-1 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </Card.Content>
                </Card>
              </div>
            )}
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
