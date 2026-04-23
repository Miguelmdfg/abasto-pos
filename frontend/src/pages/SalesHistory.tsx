import { Button, Card } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesHistory, type SaleRecord } from '../lib/sales-history';
import { useExchangeRate } from '../lib/exchange-rate';
import { getRateForDate, useRateHistory } from '../lib/rate-history';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const METODO_LABELS: Record<string, string> = {
  efectivo_bs:  'Efectivo Bs',
  efectivo_usd: 'Efectivo USD',
  pagomovil:    'Pago Móvil',
  tarjeta:      'Tarjeta',
  punto_venta:  'Punto de Venta',
  mixto:        'Mixto',
  fiado:        'Fiado',
};

function formatPriceBsFirst(priceBs: number, rate: number): JSX.Element {
  const priceUsd = rate > 0 ? priceBs / rate : 0;
  return (
    <>
      <p className="font-bold text-slate-900 dark:text-white">${priceUsd.toFixed(2)}</p>
      <p className="text-xs text-slate-500">{priceBs.toFixed(2)} Bs</p>
    </>
  );
}

function moneyBs(value: number): string {
  return `${value.toFixed(2)} Bs`;
}
function moneyUsdFromBs(valueBs: number, rate: number): string {
  return `$${(rate > 0 ? valueBs / rate : 0).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────

function ModalDetalle({ sale, onClose, rate }: { sale: SaleRecord; onClose: () => void; rate: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">Venta</p>
            <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">{sale.id}</p>
            <p className="mt-0.5 text-xs text-slate-500">{formatDate(sale.fecha)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Info general */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cajero</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">{sale.cajero}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Método</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                {METODO_LABELS[sale.metodo] ?? sale.metodo}
              </p>
            </div>
          </div>

          {/* Datos pago móvil/mixto */}
          {(sale.referencia || sale.banco) && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                📱 Pago Móvil
              </p>
              {sale.banco && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Banco:</span> {sale.banco}
                </p>
              )}
              {sale.referencia && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Ref:</span>{' '}
                  <span className="font-mono tracking-widest">{sale.referencia}</span>
                </p>
              )}
              {sale.monto_efectivo && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Efectivo adicional:</span>{' '}
                  {sale.monto_efectivo.toFixed(2)} {sale.moneda_efectivo === 'usd' ? 'USD' : 'Bs'}
                </p>
              )}
            </div>
          )}

          {/* Productos */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Productos</p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {sale.productos.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-slate-500">x{p.qty} · {moneyBs(p.price)} c/u</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {moneyBs(p.price * p.qty)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total + cerrar */}
        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">Total</span>
            <div className="text-right">
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                {moneyUsdFromBs(sale.total, rate)}
              </p>
              <p className="text-xs text-slate-500">{moneyBs(sale.total)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main SalesHistory ────────────────────────────────────────────────────────

export function SalesHistory() {
  const navigate = useNavigate();
  const { sales } = useSalesHistory();
  const { rate } = useExchangeRate();
  const { history } = useRateHistory();

  const [query, setQuery] = useState('');
  const [metodoFilter, setMetodoFilter] = useState('all');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sales.filter((sale) => {
      if (term && !sale.id.toLowerCase().includes(term) && !sale.cajero.toLowerCase().includes(term)) return false;
      if (metodoFilter !== 'all' && sale.metodo !== metodoFilter) return false;
      if (fechaDesde) {
        const desde = new Date(fechaDesde).getTime();
        if (new Date(sale.fecha).getTime() < desde) return false;
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta + 'T23:59:59').getTime();
        if (new Date(sale.fecha).getTime() > hasta) return false;
      }
      return true;
    });
  }, [sales, query, metodoFilter, fechaDesde, fechaHasta]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // KPIs
  const totalMonto = filtered.reduce((acc, s) => acc + s.total, 0);
  const cajerosActivos = new Set(filtered.map((s) => s.cajero)).size;

  const metodos = useMemo(() => {
    const set = new Set(sales.map((s) => s.metodo));
    return Array.from(set);
  }, [sales]);

  function resetFiltros() {
    setQuery('');
    setMetodoFilter('all');
    setFechaDesde('');
    setFechaHasta('');
    setPage(1);
  }

  const getSaleRate = (sale: SaleRecord) => sale.tasa ?? getRateForDate(history, sale.fecha, rate);

  return (
    <>
      {selectedSale && (
        <ModalDetalle sale={selectedSale} rate={getSaleRate(selectedSale)} onClose={() => setSelectedSale(null)} />
      )}

      <div className="p-4 md:p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Historial de Ventas
            </h2>
            <p className="text-sm text-slate-500">Consulta y filtra todas las ventas registradas.</p>
          </div>
          <Button variant="ghost" onPress={() => navigate('/pos')}>
            ← Volver al POS
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ventas', value: String(filtered.length) },
            { label: 'Monto total', value: moneyBs(totalMonto) },
            { label: 'Cajeros activos', value: String(cajerosActivos) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Content className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Buscar ID o cajero</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="VTA-... o nombre"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Método de pago</label>
                <select
                  value={metodoFilter}
                  onChange={(e) => { setMetodoFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">Todos</option>
                  {metodos.map((m) => (
                    <option key={m} value={m}>{METODO_LABELS[m] ?? m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="ghost" onPress={resetFiltros}>
                Limpiar filtros
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Tabla */}
        <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Content className="p-0">
            {sales.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-2xl">🧾</p>
                <p className="mt-2 font-semibold text-slate-500">No hay ventas registradas aún.</p>
                <p className="mt-1 text-sm text-slate-400">Las ventas del POS aparecerán aquí.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-semibold text-slate-500">Sin resultados para los filtros actuales.</p>
                <button onClick={resetFiltros} className="mt-2 text-sm text-primary hover:underline">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                {/* Cabecera */}
                <div className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1.2fr_0.7fr_auto] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                  <span>ID</span>
                  <span>Fecha</span>
                  <span>Cajero</span>
                  <span>Método</span>
                  <span>Productos</span>
                  <span>Total</span>
                  <span></span>
                </div>
                {/* Filas */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map((sale) => (
                    <div
                      key={sale.id}
                      className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1.2fr_0.7fr_auto] items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {sale.id}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(sale.fecha)}</span>
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">{sale.cajero}</span>
                      <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {METODO_LABELS[sale.metodo] ?? sale.metodo}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs text-slate-500">
                          {sale.productos.slice(0, 2).map(p => p.name).join(', ')}
                          {sale.productos.length > 2 && ` +${sale.productos.length - 2} más`}
                        </p>
                        <p className="text-xs text-slate-400">{sale.productos.reduce((a, p) => a + p.qty, 0)} uds</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{moneyBs(sale.total)}</span>
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                      >
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card.Content>

          {/* Paginación */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <Button size="sm" variant="ghost" isDisabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <p className="text-xs font-semibold text-slate-500">
                Página {page} / {totalPages}
              </p>
              <Button size="sm" variant="ghost" isDisabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
                Siguiente →
              </Button>
            </div>
          )}
        </Card>

      </div>
    </>
  );
}
