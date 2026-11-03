import { Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadCatalogProducts, type CatalogProduct } from '../lib/catalog';
import { useExchangeRate } from '../lib/exchange-rate';

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

type PersistedCosts = {
  settings: CostsSettings;
  rows: ProductCostMap;
  error: string;
};

const COSTS_STORAGE_KEY = 'abasto.costs-and-prices';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function optionalFinite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function num(value: number): string {
  return value.toFixed(2);
}

function usd(value: number): string {
  return `$${num(value)}`;
}

function bs(value: number): string {
  return `${num(value)} Bs`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function loadSettings(defaultBcv: number): CostsSettings {
  return {
    tasaBCV: defaultBcv > 0 ? round2(defaultBcv) : 0,
    tasaParalelo: 0,
    gananciaBCV: 25,
    gananciaParalelo: 25,
  };
}

function loadCosts(defaultBcv: number): PersistedCosts {
  const defaults: PersistedCosts = { settings: loadSettings(defaultBcv), rows: {}, error: '' };
  try {
    const raw = window.localStorage.getItem(COSTS_STORAGE_KEY);
    if (!raw) return defaults;

    const saved: unknown = JSON.parse(raw);
    if (!isRecord(saved)) {
      return { ...defaults, error: 'Los datos guardados de costos no son válidos; se usarán valores predeterminados.' };
    }

    const savedSettings = isRecord(saved.settings) ? saved.settings : {};
    const savedRows = isRecord(saved.rows) ? saved.rows : {};
    const rows: ProductCostMap = {};

    for (const [productId, value] of Object.entries(savedRows)) {
      if (!isRecord(value)) continue;
      const row: ProductCostRow = {
        unidadesPorBulto: Math.max(1, finiteOr(value.unidadesPorBulto, 1)),
        costoBultoUsd: Math.max(0, finiteOr(value.costoBultoUsd, 0)),
      };
      const optionalFields: (keyof ProductCostRow)[] = [
        'precioVentaUsdManual',
        'precioVentaBcvManual',
        'precioVentaParaleloManual',
        'gananciaBcvOverride',
        'gananciaParaleloOverride',
      ];
      for (const field of optionalFields) {
        const fieldValue = optionalFinite(value[field]);
        if (fieldValue !== undefined) row[field] = fieldValue;
      }
      rows[productId] = row;
    }

    return {
      settings: {
        tasaBCV: Math.max(0, finiteOr(savedSettings.tasaBCV, defaults.settings.tasaBCV)),
        tasaParalelo: Math.max(0, finiteOr(savedSettings.tasaParalelo, defaults.settings.tasaParalelo)),
        gananciaBCV: finiteOr(savedSettings.gananciaBCV, defaults.settings.gananciaBCV),
        gananciaParalelo: finiteOr(savedSettings.gananciaParalelo, defaults.settings.gananciaParalelo),
      },
      rows,
      error: '',
    };
  } catch {
    return { ...defaults, error: 'No se pudieron leer los costos guardados en este navegador.' };
  }
}

export function Costs() {
  const { rate } = useExchangeRate();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [initialCosts] = useState(() => loadCosts(rate));
  const [settings, setSettings] = useState<CostsSettings>(initialCosts.settings);
  const [rows, setRows] = useState<ProductCostMap>(initialCosts.rows);
  const [storageError, setStorageError] = useState(initialCosts.error);
  const didSkipInitialSave = useRef(false);
  const pageSize = 10;

  useEffect(() => {
    if (!didSkipInitialSave.current) {
      didSkipInitialSave.current = true;
      return;
    }
    try {
      window.localStorage.setItem(COSTS_STORAGE_KEY, JSON.stringify({ settings, rows }));
      setStorageError('');
    } catch {
      setStorageError('No se pudieron guardar los costos en este dispositivo. Revisa el almacenamiento del navegador.');
    }
  }, [rows, settings]);

  useEffect(() => {
    if (settings.tasaBCV <= 0 && rate > 0) {
      setSettings((current) => ({ ...current, tasaBCV: rate }));
    }
  }, [rate, settings.tasaBCV]);

  useEffect(() => {
    let active = true;
    loadCatalogProducts()
      .then((catalog) => {
        if (active) {
          setProducts(catalog);
          setIsFallback(false);
        }
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          setIsFallback(false);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updateRow(productId: string, patch: Partial<ProductCostRow>) {
    setRows((current) => {
      const key = String(productId);
      const row = current[key] ?? { unidadesPorBulto: 1, costoBultoUsd: 0 };
      return { ...current, [key]: { ...row, ...patch } };
    });
  }

  const computed = useMemo(() => products.map((product) => {
    const row = rows[String(product.id)] ?? { unidadesPorBulto: 1, costoBultoUsd: 0 };
    const unidadesPorBulto = row.unidadesPorBulto > 0 ? row.unidadesPorBulto : 1;
    const costoBultoUsd = row.costoBultoUsd > 0 ? row.costoBultoUsd : 0;
    const costoUnitarioUsd = costoBultoUsd / unidadesPorBulto;
    const costoBcv = settings.tasaBCV > 0 ? costoUnitarioUsd * settings.tasaBCV : null;
    const costoParalelo = settings.tasaParalelo > 0 ? costoUnitarioUsd * settings.tasaParalelo : null;
    const pctBcv = row.gananciaBcvOverride ?? settings.gananciaBCV;
    const pctParalelo = row.gananciaParaleloOverride ?? settings.gananciaParalelo;
    const precioVentaUsd = row.precioVentaUsdManual
      ?? costoUnitarioUsd + costoUnitarioUsd * pctBcv / 100;
    const precioVentaBcv = row.precioVentaBcvManual
      ?? (costoBcv === null ? null : costoBcv + costoBcv * pctBcv / 100);
    const precioVentaParalelo = row.precioVentaParaleloManual
      ?? (costoParalelo === null ? null : costoParalelo + costoParalelo * pctParalelo / 100);
    const gananciaUsd = precioVentaUsd - costoUnitarioUsd;
    const gananciaBcv = precioVentaBcv === null || costoBcv === null ? null : precioVentaBcv - costoBcv;
    const gananciaParalelo = precioVentaParalelo === null || costoParalelo === null ? null : precioVentaParalelo - costoParalelo;

    return {
      product,
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
      gananciaPromedio: gananciaBcv === null || gananciaParalelo === null
        ? null
        : (gananciaBcv + gananciaParalelo) / 2,
    };
  }), [products, rows, settings]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (Math.min(page, totalPages) - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
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
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Costos y Precios</h2>
        <p className="text-sm text-slate-500">Define tus costos y consulta rápidamente los precios de venta.</p>
      </header>

      {isFallback && (
        <Card className="border border-warning/40 bg-warning/5">
          <Card.Content className="p-3 text-xs font-semibold text-warning">
            API no disponible: usando inventario local de respaldo.
          </Card.Content>
        </Card>
      )}

      {storageError && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {storageError}
        </div>
      )}

      {(settings.tasaBCV <= 0 || settings.tasaParalelo <= 0) && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {settings.tasaBCV <= 0 && <p>Configura una tasa BCV mayor que cero para calcular precios en bolívares.</p>}
          {settings.tasaParalelo <= 0 && <p>Configura la tasa paralela para calcular esos precios. No se asignará una tasa estimada automáticamente.</p>}
        </div>
      )}

      <details className="group rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-bold text-slate-900 dark:text-white">Configuración de precios</span>
            <span className="block text-xs text-slate-500">Tasas y recargos predeterminados · Guardado en este navegador</span>
          </span>
          <span className="text-sm font-semibold text-primary group-open:hidden">Mostrar</span>
          <span className="hidden text-sm font-semibold text-primary group-open:inline">Ocultar</span>
        </summary>
        <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-500">
            Tasa BCV
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.tasaBCV.toFixed(2)}
              onChange={(event) => setSettings((current) => ({ ...current, tasaBCV: Math.max(0, Number(event.target.value) || 0) }))}
              onBlur={() => setSettings((current) => ({ ...current, tasaBCV: round2(current.tasaBCV) }))}
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
              onChange={(event) => setSettings((current) => ({ ...current, tasaParalelo: Math.max(0, Number(event.target.value) || 0) }))}
              onBlur={() => setSettings((current) => ({ ...current, tasaParalelo: round2(current.tasaParalelo) }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Recargo sobre costo BCV (%)
            <input
              type="number"
              step="0.01"
              value={settings.gananciaBCV}
              onChange={(event) => setSettings((current) => ({ ...current, gananciaBCV: Number(event.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Recargo sobre costo paralelo (%)
            <input
              type="number"
              step="0.01"
              value={settings.gananciaParalelo}
              onChange={(event) => setSettings((current) => ({ ...current, gananciaParalelo: Number(event.target.value) || 0 }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>
      </details>

      <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
        <Card.Content className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto por nombre o categoría..."
              aria-label="Buscar producto por nombre o categoría"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:max-w-md"
            />
            <p className="text-xs font-semibold text-slate-500">{filtered.length} productos</p>
          </div>

          {paginated.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
              No se encontraron productos.
            </p>
          ) : (
            <div className="space-y-3">
              {paginated.map((item) => (
                <details key={item.product.id} className="group rounded-xl border border-slate-200 bg-white transition-colors open:border-primary/30 dark:border-slate-800 dark:bg-slate-900">
                  <summary className="grid cursor-pointer list-none gap-4 p-4 [&::-webkit-details-marker]:hidden md:grid-cols-[minmax(180px,1.3fr)_repeat(3,minmax(100px,0.8fr))_minmax(130px,1fr)] md:items-center">
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-slate-900 dark:text-white">{item.product.name}</span>
                      <span className="block text-xs text-slate-500">{item.product.category} · Stock: {item.product.stock}</span>
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase text-slate-400">Costo unitario</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{usd(item.costoUnitarioUsd)}</span>
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase text-slate-400">Precio USD</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{usd(item.precioVentaUsd)}</span>
                    </span>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase text-slate-400">Precio BCV</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{item.precioVentaBcv === null ? '—' : bs(item.precioVentaBcv)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <span>
                        <span className="block text-[11px] font-semibold uppercase text-slate-400">Precio paralelo</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.precioVentaParalelo === null ? '—' : bs(item.precioVentaParalelo)}</span>
                      </span>
                      <span className="text-xs font-semibold text-primary group-open:hidden">Editar</span>
                      <span className="hidden text-xs font-semibold text-primary group-open:inline">Cerrar</span>
                    </span>
                  </summary>

                  <div className="grid gap-4 border-t border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30 lg:grid-cols-[1.2fr_1fr_1fr]">
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Costo del producto</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-slate-500">
                          Unidades por bulto
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.unidadesPorBulto}
                            onChange={(event) => updateRow(item.product.id, { unidadesPorBulto: Math.max(1, Number(event.target.value) || 1) })}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          Costo por bulto (USD)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.costoBultoUsd}
                            onChange={(event) => updateRow(item.product.id, { costoBultoUsd: Math.max(0, Number(event.target.value) || 0) })}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">
                        Costo unitario: <strong className="text-slate-700 dark:text-slate-200">{usd(item.costoUnitarioUsd)}</strong>
                        {' · '}{item.costoBcv === null ? 'Tasa BCV no configurada' : `${bs(item.costoBcv)} BCV`}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ganancia aplicada</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-slate-500">
                          Recargo sobre costo BCV (%)
                          <input
                            type="number"
                            step="0.01"
                            value={item.pctBcv}
                            onChange={(event) => updateRow(item.product.id, { gananciaBcvOverride: Number(event.target.value) || 0 })}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          Recargo sobre costo paralelo (%)
                          <input
                            type="number"
                            step="0.01"
                            value={item.pctParalelo}
                            onChange={(event) => updateRow(item.product.id, { gananciaParaleloOverride: Number(event.target.value) || 0 })}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </label>
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        <p>En USD: <strong className="text-slate-700 dark:text-slate-200">{usd(item.gananciaUsd)}</strong></p>
                        <p>En bolívares: {item.gananciaBcv === null ? 'BCV —' : <strong className="text-slate-700 dark:text-slate-200">{bs(item.gananciaBcv)} BCV</strong>} · {item.gananciaParalelo === null ? 'Paralelo —' : <strong className="text-slate-700 dark:text-slate-200">{bs(item.gananciaParalelo)} Paralelo</strong>}</p>
                        <p className="pt-1">El recargo se calcula sobre el costo, no sobre el precio de venta.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ajustar precio de venta</p>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="text-xs font-semibold text-slate-500">
                          USD
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={num(item.precioVentaUsd)}
                            onChange={(event) => updateRow(item.product.id, { precioVentaUsdManual: Math.max(0, Number(event.target.value) || 0) })}
                            onBlur={(event) => updateRow(item.product.id, { precioVentaUsdManual: round2(Math.max(0, Number(event.target.value) || 0)) })}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          BCV (Bs)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioVentaBcv === null ? '' : num(item.precioVentaBcv)}
                            onChange={(event) => updateRow(item.product.id, { precioVentaBcvManual: event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0) })}
                            onBlur={(event) => {
                              if (event.target.value !== '') {
                                updateRow(item.product.id, { precioVentaBcvManual: round2(Math.max(0, Number(event.target.value) || 0)) });
                              }
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          Paralelo (Bs)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioVentaParalelo === null ? '' : num(item.precioVentaParalelo)}
                            onChange={(event) => updateRow(item.product.id, { precioVentaParaleloManual: event.target.value === '' ? undefined : Math.max(0, Number(event.target.value) || 0) })}
                            onBlur={(event) => {
                              if (event.target.value !== '') {
                                updateRow(item.product.id, { precioVentaParaleloManual: round2(Math.max(0, Number(event.target.value) || 0)) });
                              }
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </label>
                      </div>
                      {(item.product && (
                        rows[String(item.product.id)]?.precioVentaUsdManual !== undefined
                        || rows[String(item.product.id)]?.precioVentaBcvManual !== undefined
                        || rows[String(item.product.id)]?.precioVentaParaleloManual !== undefined
                      )) && (
                        <button
                          type="button"
                          onClick={() => updateRow(item.product.id, {
                            precioVentaUsdManual: undefined,
                            precioVentaBcvManual: undefined,
                            precioVentaParaleloManual: undefined,
                          })}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Volver a precios calculados
                        </button>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}

          {filtered.length > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ← Anterior
              </button>
              <p className="text-xs font-semibold text-slate-500">Página {page} de {totalPages}</p>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
