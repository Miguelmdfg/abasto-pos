import { Button, Card, Spinner } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useExchangeRate } from '../lib/exchange-rate';
import { useDebts, type DebtItem } from '../lib/debts-context';
import { useSalesHistory } from '../lib/sales-history';

// ─── Types / Helpers ──────────────────────────────────────────────────────────

type DebtStatus = 'al_dia' | 'por_vencer' | 'vencida' | 'saldada';

function moneyBs(v: number) { return `${v.toFixed(2)} Bs`; }
function moneyUsd(v: number, rate: number) { return rate > 0 ? `$${(v / rate).toFixed(2)} USD` : ''; }

function fmtDate(fecha?: string) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDaysSince(fecha?: string): number {
  if (!fecha) return 0;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(debt: DebtItem): DebtStatus {
  if (debt.deuda_total <= 0) return 'saldada';
  const days = getDaysSince(debt.ultima_compra);
  if (days > 30) return 'vencida';
  if (days >= 20) return 'por_vencer';
  return 'al_dia';
}

const STATUS_LABEL: Record<DebtStatus, string> = {
  al_dia: 'Al día', por_vencer: 'Por vencer', vencida: 'Vencida', saldada: 'Saldada',
};
const STATUS_CLASS: Record<DebtStatus, string> = {
  al_dia: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  por_vencer: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  vencida: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  saldada: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const emptyClient = { nombre: '', telefono: '', cedula: '', limite_credito: '3000' };
const emptyAbono = { monto: '', nota: '' };

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Debts() {
  const { rate } = useExchangeRate();
  const { debts, addClient, addAbono } = useDebts();
  const { sales } = useSalesHistory();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<DebtStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const [showNewClient, setShowNewClient] = useState(false);
  const [showAbono, setShowAbono] = useState(false);

  const [clientForm, setClientForm] = useState(emptyClient);
  const [abonoForm, setAbonoForm] = useState(emptyAbono);
  const [formErr, setFormErr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() =>
    debts.filter((d) => {
      const matchQuery = !query.trim() || d.nombre.toLowerCase().includes(query.toLowerCase()) || (d.telefono ?? '').includes(query);
      const matchStatus = filterStatus === 'all' || getStatus(d) === filterStatus;
      return matchQuery && matchStatus;
    }), [debts, query, filterStatus]);

  const selected = useMemo(() => debts.find((d) => d.id === selectedId) ?? null, [debts, selectedId]);

  const totalDeuda = useMemo(() => debts.reduce((a, d) => a + d.deuda_total, 0), [debts]);
  const vencidas = useMemo(() => debts.filter((d) => getStatus(d) === 'vencida').length, [debts]);
  const porVencer = useMemo(() => debts.filter((d) => getStatus(d) === 'por_vencer').length, [debts]);

  function handleSaveClient() {
    setFormErr('');
    if (!clientForm.nombre.trim()) { setFormErr('El nombre es obligatorio.'); return; }
    const limite = Number(clientForm.limite_credito);
    if (isNaN(limite) || limite <= 0) { setFormErr('Ingresa un límite de crédito válido.'); return; }
    setIsSaving(true);
    addClient({ nombre: clientForm.nombre, telefono: clientForm.telefono, cedula: clientForm.cedula, limite_credito: limite });
    setIsSaving(false);
    setShowNewClient(false);
    setClientForm(emptyClient);
  }

  function handleSaveAbono() {
    setFormErr('');
    if (!selected) return;
    const monto = Number(abonoForm.monto);
    if (isNaN(monto) || monto <= 0) { setFormErr('Ingresa un monto válido.'); return; }
    if (monto > selected.deuda_total) { setFormErr('El abono supera la deuda actual.'); return; }
    setIsSaving(true);
    addAbono(selected.id, monto, abonoForm.nota || undefined);
    setIsSaving(false);
    setShowAbono(false);
    setAbonoForm(emptyAbono);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Módulo de Deudas</h2>
          <p className="text-sm text-slate-500">Control de ventas fiadas y abonos por cliente.</p>
        </div>
        <Button variant="primary" onPress={() => { setFormErr(''); setShowNewClient(true); }}>
          + Nuevo cliente
        </Button>
      </div>

      {debts.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl">📋</p>
          <p className="mt-2 font-semibold text-slate-500">No hay clientes registrados aún.</p>
          <p className="mt-1 text-sm text-slate-400">Las ventas fiadas del POS aparecerán aquí automáticamente.</p>
        </div>
      )}

      {/* KPIs */}
      {debts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Deuda total acumulada', main: moneyBs(totalDeuda), sub: moneyUsd(totalDeuda, rate), color: 'text-slate-900 dark:text-white' },
            { label: 'Cuentas vencidas (+30 días)', main: String(vencidas), sub: 'clientes en mora', color: vencidas > 0 ? 'text-red-600' : 'text-slate-900 dark:text-white' },
            { label: 'Por vencer (20-30 días)', main: String(porVencer), sub: 'próximos a vencer', color: porVencer > 0 ? 'text-yellow-600' : 'text-slate-900 dark:text-white' },
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
      )}

      {debts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">

          {/* ── Lista clientes ── */}
          <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
            <Card.Header className="px-4 pb-0 pt-4"><Card.Title>Clientes</Card.Title></Card.Header>
            <Card.Content className="space-y-3 p-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex flex-wrap gap-2">
                {(['all', 'al_dia', 'por_vencer', 'vencida', 'saldada'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      filterStatus === s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">No hay clientes para mostrar.</p>
                ) : filtered.map((d) => {
                  const status = getStatus(d);
                  const isOver = d.deuda_total > d.limite_credito;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selectedId === d.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.nombre}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{d.telefono ?? 'Sin teléfono'}</p>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isOver ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'}`}>
                            {moneyBs(d.deuda_total)}
                          </p>
                          <p className="text-xs text-slate-400">Límite: {moneyBs(d.limite_credito)}</p>
                        </div>
                      </div>
                      {isOver && <p className="mt-1 text-xs font-semibold text-red-500">⚠️ Límite superado</p>}
                    </button>
                  );
                })}
              </div>
            </Card.Content>
          </Card>

          {/* ── Detalle cliente ── */}
          <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
            {!selected ? (
              <Card.Content className="flex min-h-[300px] items-center justify-center p-8">
                <p className="text-center text-sm text-slate-400">Selecciona un cliente para ver su detalle.</p>
              </Card.Content>
            ) : (
              <>
                <Card.Header className="px-4 pb-0 pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Card.Title>{selected.nombre}</Card.Title>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {selected.telefono && `📞 ${selected.telefono}`}
                        {selected.cedula && ` · CI: ${selected.cedula}`}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASS[getStatus(selected)]}`}>
                      {STATUS_LABEL[getStatus(selected)]}
                    </span>
                  </div>
                </Card.Header>
                <Card.Content className="space-y-4 p-4">
                  {/* Resumen */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <p className="text-xs font-semibold uppercase text-slate-500">Deuda actual</p>
                      <p className={`mt-0.5 text-xl font-extrabold ${selected.deuda_total > selected.limite_credito ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                        {moneyBs(selected.deuda_total)}
                      </p>
                      <p className="text-xs text-slate-400">{moneyUsd(selected.deuda_total, rate)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <p className="text-xs font-semibold uppercase text-slate-500">Límite de crédito</p>
                      <p className="mt-0.5 text-xl font-extrabold text-slate-900 dark:text-white">{moneyBs(selected.limite_credito)}</p>
                      <p className="text-xs text-slate-400">
                        Disponible: {moneyBs(Math.max(0, selected.limite_credito - selected.deuda_total))}
                      </p>
                    </div>
                  </div>

                  {getDaysSince(selected.ultima_compra) > 30 && selected.deuda_total > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        🚨 Morosidad: {getDaysSince(selected.ultima_compra)} días sin abonar
                      </p>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="primary" fullWidth
                      isDisabled={selected.deuda_total <= 0}
                      onPress={() => { setFormErr(''); setShowAbono(true); }}
                    >
                      + Registrar abono
                    </Button>
                  </div>

                  {/* Ventas asociadas con productos */}
                  {selected.ventas.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Ventas fiadas</p>
                      <div className="space-y-2">
                        {selected.ventas.map((vid) => {
                          const sale = sales.find(s => s.id === vid);
                          return (
                            <div key={vid} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{vid}</span>
                                {sale && <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{moneyBs(sale.total)}</span>}
                              </div>
                              {sale && sale.productos.length > 0 && (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {sale.productos.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                                      <span className="text-slate-700 dark:text-slate-300">{p.name} <span className="text-slate-400">x{p.qty}</span></span>
                                      <span className="font-semibold text-slate-600 dark:text-slate-300">{moneyBs(p.price * p.qty)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Historial abonos */}
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Historial de abonos</p>
                    {selected.abonos.length === 0 ? (
                      <p className="text-sm text-slate-400">Sin abonos registrados.</p>
                    ) : (
                      <div className="space-y-2">
                        {[...selected.abonos].reverse().map((a) => (
                          a.monto > 0 && (
                            <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
                              <div>
                                <p className="text-sm font-semibold text-green-600">+ {moneyBs(a.monto)}</p>
                                {a.nota && <p className="text-xs text-slate-400">{a.nota}</p>}
                              </div>
                              <p className="text-xs text-slate-400">{fmtDate(a.fecha)}</p>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    Última compra: {fmtDate(selected.ultima_compra)}
                    {selected.ultima_compra && ` · hace ${getDaysSince(selected.ultima_compra)} días`}
                  </p>
                </Card.Content>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Modal: Nuevo cliente */}
      {showNewClient && (
        <Modal title="Nuevo cliente" onClose={() => setShowNewClient(false)}>
          <div className="space-y-3">
            <Field label="Nombre *" value={clientForm.nombre} onChange={(v) => setClientForm((p) => ({ ...p, nombre: v }))} placeholder="Ej. Juan García" />
            <Field label="Teléfono" value={clientForm.telefono} onChange={(v) => setClientForm((p) => ({ ...p, telefono: v }))} placeholder="0414-0000000" />
            <Field label="Cédula" value={clientForm.cedula} onChange={(v) => setClientForm((p) => ({ ...p, cedula: v }))} placeholder="V-00000000" />
            <Field label="Límite de crédito (Bs) *" type="number" value={clientForm.limite_credito} onChange={(v) => setClientForm((p) => ({ ...p, limite_credito: v }))} placeholder="3000" />
            {formErr && <p className="text-xs font-semibold text-red-500">⚠️ {formErr}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowNewClient(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
              <button onClick={handleSaveClient} disabled={isSaving} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                {isSaving ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Registrar abono */}
      {showAbono && selected && (
        <Modal title={`Abono — ${selected.nombre}`} onClose={() => setShowAbono(false)}>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Deuda pendiente: <span className="font-bold text-red-600">{moneyBs(selected.deuda_total)}</span></p>
            <Field label="Monto del abono (Bs) *" type="number" value={abonoForm.monto} onChange={(v) => setAbonoForm((p) => ({ ...p, monto: v }))} placeholder="0.00" />
            <Field label="Nota" value={abonoForm.nota} onChange={(v) => setAbonoForm((p) => ({ ...p, nota: v }))} placeholder="Opcional" />
            {formErr && <p className="text-xs font-semibold text-red-500">⚠️ {formErr}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAbono(false)} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
              <button onClick={handleSaveAbono} disabled={isSaving} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                {isSaving ? 'Guardando...' : 'Registrar abono'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
