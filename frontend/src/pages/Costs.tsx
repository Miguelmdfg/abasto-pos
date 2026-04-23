import { Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useExchangeRate } from '../lib/exchange-rate';
import { MOCK_PRODUCTS } from '../mocks/products';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const COSTS_SETTINGS_KEY = 'abasto.costs.settings';
const COSTS_ROWS_KEY = 'abasto.costs.rows';

type Product = {
  id: number;
  name: string;
  category: string;
  stock: number;
  price?: number;
  cost?: number;
  costo?: number;
};

type CostsSettings = {
  tasaBCV: number;
  tasaParalelo: number;
  gananciaBCV: number;
  gananciaParalelo: number;
};

type ProductCostRow = {
  unidadesPorBulto: number;
  costoBultoUsd: number;
  precioVentaUsdManual?: number;
  precioVentaBcvManual?: number;
  precioVentaParaleloManual?: number;
  gananciaBcvOverride?: number;
  gananciaParaleloOverride?: number;
};

type ProductCostMap = Record<string, ProductCostRow>;

function num(v: number): string { return v.toFixed(2); }
function usd(v: number): string { return `$${num(v)}`; }
function bs(v: number): string { return `${num(v)} Bs`; }
function round2(v: number): number { return Math.round(v * 100) / 100; }

function loadSettings(defaultBcv: number): CostsSettings {
  try {
    const raw = localStorage.getItem(COSTS_SETTINGS_KEY);
    if (!raw) {
      return { tasaBCV: defaultBcv, tasaParalelo: defaultBcv * 1.1, gananciaBCV: 25, gananciaParalelo: 25 };
    }
    const parsed = JSON.parse(raw) as Partial<CostsSettings>;
    return {
      tasaBCV: parsed.tasaBCV && parsed.tasaBCV > 0 ? round2(parsed.tasaBCV) : round2(defaultBcv),
      tasaParalelo: parsed.tasaParalelo && parsed.tasaParalelo > 0 ? round2(parsed.tasaParalelo) : round2(defaultBcv * 1.1),
      gananciaBCV: Number.isFinite(parsed.gananciaBCV) ? Number(parsed.gananciaBCV) : 25,
      gananciaParalelo: Number.isFinite(parsed.gananciaParalelo) ? Number(parsed.gananciaParalelo) : 25,
    };
  } catch {
    return { tasaBCV: round2(defaultBcv), tasaParalelo: round2(defaultBcv * 1.1), gananciaBCV: 25, gananciaParalelo: 25 };
  }
}

function loadRows(): ProductCostMap {
  try {
    const raw = localStorage.getItem(COSTS_ROWS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProductCostMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function Costs() {
  const { rate } = useExchangeRate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState<CostsSettings>(() => loadSettings(rate));
  const [rows, setRows] = useState<ProductCostMap>(loadRows);
  const PAGE_SIZE = 10;

  useEffect(() => {
    localStorage.setItem(COSTS_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(COSTS_ROWS_KEY, JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    if (settings.tasaBCV <= 0) {
      setSettings((prev) => ({ ...prev, tasaBCV: rate > 0 ? rate : 1 }));
    }
  }, [rate, settings.tasaBCV]);

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

  function updateRow(productId: number, patch: Partial<ProductCostRow>) {
    setRows((prev) => {
      const key = String(productId);
      const current = prev[key] ?? { unidadesPorBulto: 1, costoBultoUsd: 0 };
      return { ...prev, [key]: { ...current, ...patch } };
    });
  }

  const computed = useMemo(() => {
    return products.map((product) => {
      const key = String(product.id);
      const row = rows[key] ?? { unidadesPorBulto: 1, costoBultoUsd: 0 };
      const unidadesPorBulto = row.unidadesPorBulto > 0 ? row.unidadesPorBulto : 1;
      const costoBultoUsd = row.costoBultoUsd > 0 ? row.costoBultoUsd : 0;

      const costoUnitarioUsd = unidadesPorBulto > 0 ? costoBultoUsd / unidadesPorBulto : 0;
      const costoBcv = costoUnitarioUsd * settings.tasaBCV;
      const costoParalelo = costoUnitarioUsd * settings.tasaParalelo;

      const pctBcv = row.gananciaBcvOverride ?? settings.gananciaBCV;
      const pctParalelo = row.gananciaParaleloOverride ?? settings.gananciaParalelo;

      const precioVentaBcvAuto = costoBcv + (costoBcv * pctBcv / 100);
      const precioVentaParaleloAuto = costoParalelo + (costoParalelo * pctParalelo / 100);
      const precioVentaUsdAuto = costoUnitarioUsd + (costoUnitarioUsd * pctBcv / 100);

      const precioVentaBcv = row.precioVentaBcvManual ?? precioVentaBcvAuto;
      const precioVentaParalelo = row.precioVentaParaleloManual ?? precioVentaParaleloAuto;
      const precioVentaUsd = row.precioVentaUsdManual ?? precioVentaUsdAuto;

      const gananciaUsd = precioVentaUsd - costoUnitarioUsd;
      const gananciaBcv = precioVentaBcv - costoBcv;
      const gananciaParalelo = precioVentaParalelo - costoParalelo;
      const gananciaPromedio = (gananciaBcv + gananciaParalelo) / 2;

      return {
        product,
        row,
        unidadesPorBulto,
        costoBultoUsd,
        costoUnitarioUsd,
        costoBcv,
        costoParalelo,
        pctBcv,
        pctParalelo,
        precioVentaUsd,
        precioVentaBcv,
        precioVentaParalelo,
        gananciaUsd,
        gananciaBcv,
        gananciaParalelo,
        gananciaPromedio,
      };
    });
  }, [products, rows, settings]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return computed;
    return computed.filter(({ product }) =>
      product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term),
    );
  }, [computed, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <Spinner size="sm" />
        <p className="text-sm text-slate-500">Cargando módulo de costos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Costos y Precios</h2>
        <p className="text-sm text-slate-500">Control dinámico tipo Excel con BCV/Paralelo, precios y ganancias.</p>
      </div>

      {isFallback && (
        <Card className="border border-warning/40 bg-warning/5">
          <Card.Content className="p-3 text-xs font-semibold text-warning">
            API no disponible: usando inventario local de respaldo.
          </Card.Content>
        </Card>
      )}

      <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
        <Card.Header className="px-4 pb-0 pt-4">
          <Card.Title>Parámetros Globales</Card.Title>
        </Card.Header>
        <Card.Content className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-slate-500">
            Tasa BCV
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.tasaBCV.toFixed(2)}
              onChange={(e) => setSettings((p) => ({ ...p, tasaBCV: Math.max(0, Number(e.target.value) || 0) }))}
              onBlur={() => setSettings((p) => ({ ...p, tasaBCV: round2(p.tasaBCV) }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Tasa Paralela
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.tasaParalelo.toFixed(2)}
              onChange={(e) => setSettings((p) => ({ ...p, tasaParalelo: Math.max(0, Number(e.target.value) || 0) }))}
              onBlur={() => setSettings((p) => ({ ...p, tasaParalelo: round2(p.tasaParalelo) }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            % ganancia BCV
            <input
              type="number"
              step="0.01"
              value={settings.gananciaBCV}
              onChange={(e) => setSettings((p) => ({ ...p, gananciaBCV: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            % ganancia Paralelo
            <input
              type="number"
              step="0.01"
              value={settings.gananciaParalelo}
              onChange={(e) => setSettings((p) => ({ ...p, gananciaParalelo: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </Card.Content>
      </Card>

      <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
        <Card.Content className="space-y-3 p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Desliza horizontalmente para ver toda la tabla.</p>
          </div>
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[1400px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="px-2 py-2">Producto</th>
                  <th className="px-2 py-2">Inventario</th>
                  <th className="px-2 py-2">Unidad/Bulto</th>
                  <th className="px-2 py-2">Costo Bulto USD</th>
                  <th className="px-2 py-2">Costo Unit USD</th>
                  <th className="px-2 py-2">Costo BCV</th>
                  <th className="px-2 py-2">Costo Paralelo</th>
                  <th className="px-2 py-2">% G BCV</th>
                  <th className="px-2 py-2">% G Paralelo</th>
                  <th className="px-2 py-2">Precio USD</th>
                  <th className="px-2 py-2">Precio BCV</th>
                  <th className="px-2 py-2">Precio Paralelo</th>
                  <th className="px-2 py-2">Ganancias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map((item) => (
                  <tr key={item.product.id}>
                    <td className="px-2 py-2 align-middle">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.product.name}</p>
                      <p className="text-xs text-slate-400">{item.product.category}</p>
                    </td>
                    <td className="px-2 py-2">{item.product.stock}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.unidadesPorBulto}
                        onChange={(e) => updateRow(item.product.id, { unidadesPorBulto: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.costoBultoUsd}
                        onChange={(e) => updateRow(item.product.id, { costoBultoUsd: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2">{usd(item.costoUnitarioUsd)}</td>
                    <td className="px-2 py-2">{bs(item.costoBcv)}</td>
                    <td className="px-2 py-2">{bs(item.costoParalelo)}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.pctBcv}
                        onChange={(e) => updateRow(item.product.id, { gananciaBcvOverride: Number(e.target.value) || 0 })}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.pctParalelo}
                        onChange={(e) => updateRow(item.product.id, { gananciaParaleloOverride: Number(e.target.value) || 0 })}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={num(item.precioVentaUsd)}
                        onChange={(e) => updateRow(item.product.id, { precioVentaUsdManual: Math.max(0, Number(e.target.value) || 0) })}
                        onBlur={(e) => updateRow(item.product.id, { precioVentaUsdManual: round2(Math.max(0, Number(e.target.value) || 0)) })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={num(item.precioVentaBcv)}
                        onChange={(e) => updateRow(item.product.id, { precioVentaBcvManual: Math.max(0, Number(e.target.value) || 0) })}
                        onBlur={(e) => updateRow(item.product.id, { precioVentaBcvManual: round2(Math.max(0, Number(e.target.value) || 0)) })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={num(item.precioVentaParalelo)}
                        onChange={(e) => updateRow(item.product.id, { precioVentaParaleloManual: Math.max(0, Number(e.target.value) || 0) })}
                        onBlur={(e) => updateRow(item.product.id, { precioVentaParaleloManual: round2(Math.max(0, Number(e.target.value) || 0)) })}
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="min-w-[180px] rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                        <p className="flex items-center justify-between"><span className="text-slate-500">USD</span><span className="font-semibold text-slate-800 dark:text-slate-200">{usd(item.gananciaUsd)}</span></p>
                        <p className="mt-1 flex items-center justify-between"><span className="text-slate-500">BCV</span><span className="font-semibold text-slate-800 dark:text-slate-200">{bs(item.gananciaBcv)}</span></p>
                        <p className="mt-1 flex items-center justify-between border-t border-slate-200 pt-1 dark:border-slate-700"><span className="text-slate-500">Promedio</span><span className="font-bold text-primary">{bs(item.gananciaPromedio)}</span></p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ← Anterior
              </button>
              <p className="text-xs font-semibold text-slate-500">
                Página {page} de {totalPages} · {filtered.length} productos
              </p>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Siguiente →
              </button>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
