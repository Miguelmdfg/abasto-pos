import { Button, Card } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashierShift, type CashierShift } from '../lib/cashier-shift';

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function moneyBs(value: number): string {
  return `${value.toFixed(2)} Bs`;
}

function statusLabel(status: CashierShift['estadoCuadre']): string {
  if (status === 'cuadrado') return 'Caja cuadrada';
  if (status === 'sobrante') return 'Sobrante';
  return 'Faltante';
}

function statusClass(status: CashierShift['estadoCuadre']): string {
  if (status === 'cuadrado') return 'bg-success/10 text-success';
  if (status === 'sobrante') return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
}

function DetailModal({ record, onClose }: { record: CashierShift; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500">{record.id}</p>
            <p className="text-sm text-slate-500">{formatDate(record.fecha)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Total venta</p>
              <p className="font-extrabold">{moneyBs(record.totalVenta)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Total caja</p>
              <p className="font-extrabold">{moneyBs(record.totalCaja)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Diferencia</p>
              <p className="font-extrabold">{moneyBs(record.diferencia)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Tasa BCV</p>
              <p className="font-extrabold">{record.tasaCierre.toFixed(2)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Métodos de pago</p>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              <p>Efectivo USD: <span className="font-semibold">{record.efectivoDivisas.toFixed(2)}</span></p>
              <p>Efectivo Bs: <span className="font-semibold">{moneyBs(record.efectivoBolivares)}</span></p>
              <p>Punto venta: <span className="font-semibold">{moneyBs(record.puntoVenta)}</span></p>
              <p>Pago móvil: <span className="font-semibold">{moneyBs(record.pagoMovil)}</span></p>
              <p>Créditos pagados: <span className="font-semibold">{moneyBs(record.creditosPagados)}</span></p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Dinero dejado y distribución</p>
            <p className="text-sm">Dejado en caja: <span className="font-semibold">{moneyBs(record.totalDejadoCaja)}</span></p>
            {record.distribucion.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Sin distribución registrada.</p>
            ) : (
              <div className="mt-2 space-y-1">
                {record.distribucion.map((item, idx) => (
                  <div key={`${item.responsable}-${idx}`} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                    <span>{item.responsable}</span>
                    <span className="font-semibold">{moneyBs(item.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Cierres parciales</p>
            {record.cierresParciales.length === 0 ? (
              <p className="text-sm text-slate-500">No se registraron cierres parciales.</p>
            ) : (
              <div className="space-y-1">
                {record.cierresParciales.map((item, idx) => (
                  <div key={`${item.nombre}-${idx}`} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                    <span>{item.nombre}</span>
                    <span className="font-semibold">{moneyBs(item.totalCaja)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CashClosures() {
  const navigate = useNavigate();
  const { shifts } = useCashierShift();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estado, setEstado] = useState<'all' | CashierShift['estadoCuadre']>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CashierShift | null>(null);

  const filtered = useMemo(() => {
    return shifts.filter((record) => {
      if (estado !== 'all' && record.estadoCuadre !== estado) return false;
      const time = new Date(record.fecha).getTime();
      if (fechaDesde && time < new Date(fechaDesde).getTime()) return false;
      if (fechaHasta && time > new Date(`${fechaHasta}T23:59:59`).getTime()) return false;
      return true;
    });
  }, [estado, fechaDesde, fechaHasta, shifts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalVentas = filtered.reduce((acc, item) => acc + item.totalVenta, 0);
  const totalCaja = filtered.reduce((acc, item) => acc + item.totalCaja, 0);
  const totalDiff = filtered.reduce((acc, item) => acc + item.diferencia, 0);

  return (
    <>
      {selected && <DetailModal record={selected} onClose={() => setSelected(null)} />}
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Historial de Cierres de Caja</h2>
            <p className="text-sm text-slate-500">Consulta cierres diarios, parciales, diferencia de cuadre y distribución.</p>
          </div>
          <Button variant="ghost" onPress={() => navigate('/pos')}>← Volver al POS</Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cierres</p>
            <p className="mt-1 text-xl font-extrabold">{filtered.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total venta</p>
            <p className="mt-1 text-xl font-extrabold">{moneyBs(totalVentas)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diferencia acumulada</p>
            <p className="mt-1 text-xl font-extrabold">{moneyBs(totalDiff)}</p>
          </div>
        </div>

        <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Content className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Desde</label>
                <input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Hasta</label>
                <input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Estado</label>
                <select value={estado} onChange={(e) => { setEstado(e.target.value as typeof estado); setPage(1); }} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  <option value="all">Todos</option>
                  <option value="cuadrado">Caja cuadrada</option>
                  <option value="sobrante">Sobrante</option>
                  <option value="faltante">Faltante</option>
                </select>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Content className="p-0">
            {filtered.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500">
                No hay cierres de caja para los filtros seleccionados.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.9fr_auto] gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                  <span>ID</span>
                  <span>Fecha</span>
                  <span>Total venta</span>
                  <span>Total caja</span>
                  <span>Estado</span>
                  <span></span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginated.map((record) => (
                    <div key={record.id} className="grid grid-cols-[1.2fr_1fr_0.9fr_0.9fr_0.9fr_auto] items-center gap-2 px-4 py-3 text-sm">
                      <span className="font-mono text-xs font-bold">{record.id}</span>
                      <span className="text-xs text-slate-500">{formatDate(record.fecha)}</span>
                      <span className="font-semibold">{moneyBs(record.totalVenta)}</span>
                      <span className="font-semibold">{moneyBs(record.totalCaja)}</span>
                      <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(record.estadoCuadre)}`}>
                        {statusLabel(record.estadoCuadre)}
                      </span>
                      <button onClick={() => setSelected(record)} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card.Content>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <Button size="sm" variant="ghost" isDisabled={page <= 1} onPress={() => setPage((p) => p - 1)}>← Anterior</Button>
              <p className="text-xs font-semibold text-slate-500">Página {page} / {totalPages}</p>
              <Button size="sm" variant="ghost" isDisabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>Siguiente →</Button>
            </div>
          )}
        </Card>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold">Total caja filtrada: {moneyBs(totalCaja)}</p>
        </div>
      </div>
    </>
  );
}
