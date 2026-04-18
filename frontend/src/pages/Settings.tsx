import { useState } from 'react';
import { Card } from '@heroui/react';
import { useSettings, type PaymentMethodKey } from '../lib/settings-context';
import { useExchangeRate } from '../lib/exchange-rate';
import { useRateHistory } from '../lib/rate-history';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BANCOS_VE = [
  'Banesco', 'Banco de Venezuela', 'Mercantil', 'BBVA Provincial',
  'Banco del Tesoro', 'BNC', 'Bancamiga', 'Bicentenario', 'Otro',
];

const METODOS_LABEL: Record<PaymentMethodKey, string> = {
  efectivo_bs:  'Efectivo Bs',
  efectivo_usd: 'Efectivo USD',
  pagomovil:    'Pago Móvil',
  punto_venta:  'Punto de Venta',
  mixto:        'Pago Mixto',
  fiado:        'Fiado (Deuda)',
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
      <Card.Header className="px-6 pb-0 pt-5">
        <div>
          <Card.Title className="text-base">{title}</Card.Title>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </Card.Header>
      <Card.Content className="p-6 pt-4">{children}</Card.Content>
    </Card>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function SaveBtn({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onClick}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
      >
        Guardar cambios
      </button>
      {saved && <span className="text-sm font-semibold text-green-600">✅ Guardado</span>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { rate, setRate } = useExchangeRate();

  // Local form states per section
  const [rateInput, setRateInput] = useState(String(rate));
  const [ivaInput, setIvaInput] = useState(String(settings.iva));
  const [savedTasa, setSavedTasa] = useState(false);

  const [negocio, setNegocio] = useState({
    nombre: settings.negocio_nombre,
    rif: settings.negocio_rif,
    direccion: settings.negocio_direccion,
    telefono: settings.negocio_telefono,
  });
  const [savedNegocio, setSavedNegocio] = useState(false);

  const [pagomovil, setPagomovil] = useState({
    banco: settings.pagomovil_banco,
    numero: settings.pagomovil_numero,
    cedula: settings.pagomovil_cedula,
  });
  const [savedPagomovil, setSavedPagomovil] = useState(false);

  const [metodos, setMetodos] = useState({ ...settings.metodos_habilitados });
  const [savedMetodos, setSavedMetodos] = useState(false);

  const [alertas, setAlertas] = useState({
    stock_minimo: String(settings.stock_minimo_global),
    dias_morosidad: String(settings.dias_alerta_morosidad),
    limite_deuda: String(settings.limite_deuda_global),
  });
  const [savedAlertas, setSavedAlertas] = useState(false);

  const [showReset, setShowReset] = useState(false);

  // ── Save handlers ─────────────────────────────────────────────────────────

  function saveTasa() {
    const r = Number(rateInput);
    const iva = Number(ivaInput);
    if (!isNaN(r) && r > 0) setRate(r);
    if (!isNaN(iva) && iva >= 0 && iva <= 100) updateSettings({ iva });
    setSavedTasa(true);
    setTimeout(() => setSavedTasa(false), 3000);
  }

  function saveNegocio() {
    updateSettings({
      negocio_nombre: negocio.nombre,
      negocio_rif: negocio.rif,
      negocio_direccion: negocio.direccion,
      negocio_telefono: negocio.telefono,
    });
    setSavedNegocio(true);
    setTimeout(() => setSavedNegocio(false), 3000);
  }

  function savePagomovil() {
    updateSettings({
      pagomovil_banco: pagomovil.banco,
      pagomovil_numero: pagomovil.numero,
      pagomovil_cedula: pagomovil.cedula,
    });
    setSavedPagomovil(true);
    setTimeout(() => setSavedPagomovil(false), 3000);
  }

  function saveMetodos() {
    updateSettings({ metodos_habilitados: metodos });
    setSavedMetodos(true);
    setTimeout(() => setSavedMetodos(false), 3000);
  }

  function saveAlertas() {
    const stock = Number(alertas.stock_minimo);
    const dias = Number(alertas.dias_morosidad);
    const limite = Number(alertas.limite_deuda);
    updateSettings({
      stock_minimo_global: isNaN(stock) ? settings.stock_minimo_global : stock,
      dias_alerta_morosidad: isNaN(dias) ? settings.dias_alerta_morosidad : dias,
      limite_deuda_global: isNaN(limite) ? settings.limite_deuda_global : limite,
    });
    setSavedAlertas(true);
    setTimeout(() => setSavedAlertas(false), 3000);
  }

  function handleReset() {
    resetSettings();
    setRateInput('36');
    setIvaInput('16');
    setNegocio({ nombre: 'Abasto POS', rif: '', direccion: '', telefono: '' });
    setPagomovil({ banco: '', numero: '', cedula: '' });
    setMetodos({ efectivo_bs: true, efectivo_usd: true, pagomovil: true, tarjeta: true, punto_venta: true, mixto: true, fiado: true });
    setAlertas({ stock_minimo: '5', dias_morosidad: '30', limite_deuda: '5000' });
    setShowReset(false);
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Configuración</h2>
        <p className="text-sm text-slate-500">Parámetros globales del sistema. Los cambios se aplican de inmediato.</p>
      </div>

      {/* ── 1. Tasa del día + IVA ── */}
      <Section
        title="💱 Tasa del día e IVA"
        subtitle="Define la tasa de cambio Bs/USD y el porcentaje de IVA aplicado a las ventas."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tasa del día (Bs por 1 USD)" hint="Se usa en todo el sistema para conversión automática.">
            <TextInput type="number" value={rateInput} onChange={setRateInput} placeholder="36.00" />
          </Field>
          <Field label="IVA (%)" hint="Porcentaje de impuesto sobre ventas. 0 para desactivar.">
            <TextInput type="number" value={ivaInput} onChange={setIvaInput} placeholder="16" />
          </Field>
        </div>
        <div className="mt-1">
          <p className="text-xs text-slate-400">
            Tasa actual en uso: <span className="font-semibold text-slate-600 dark:text-slate-300">{rate.toFixed(2)} Bs/USD</span>
            {' · '}IVA actual: <span className="font-semibold text-slate-600 dark:text-slate-300">{settings.iva}%</span>
          </p>
        </div>
        <SaveBtn onClick={saveTasa} saved={savedTasa} />
      </Section>

      {/* ── 2. Datos del negocio ── */}
      <Section
        title="🏪 Datos del negocio"
        subtitle="Información del establecimiento. Aparece en reportes y recibos."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del negocio">
            <TextInput value={negocio.nombre} onChange={(v) => setNegocio((p) => ({ ...p, nombre: v }))} placeholder="Mi Abasto" />
          </Field>
          <Field label="RIF">
            <TextInput value={negocio.rif} onChange={(v) => setNegocio((p) => ({ ...p, rif: v }))} placeholder="J-00000000-0" />
          </Field>
          <Field label="Dirección" hint="Dirección completa del local.">
            <TextInput value={negocio.direccion} onChange={(v) => setNegocio((p) => ({ ...p, direccion: v }))} placeholder="Av. Principal, Local 1" />
          </Field>
          <Field label="Teléfono">
            <TextInput value={negocio.telefono} onChange={(v) => setNegocio((p) => ({ ...p, telefono: v }))} placeholder="0212-0000000" />
          </Field>
        </div>
        <SaveBtn onClick={saveNegocio} saved={savedNegocio} />
      </Section>

      {/* ── 3. Cuenta de Pago Móvil ── */}
      <Section
        title="📱 Cuenta de Pago Móvil"
        subtitle="Datos de la cuenta destino que se muestran al cajero al cobrar con pago móvil."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Banco">
            <select
              value={pagomovil.banco}
              onChange={(e) => setPagomovil((p) => ({ ...p, banco: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar...</option>
              {BANCOS_VE.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Número de teléfono" hint="Número asociado a la cuenta.">
            <TextInput value={pagomovil.numero} onChange={(v) => setPagomovil((p) => ({ ...p, numero: v }))} placeholder="0414-0000000" />
          </Field>
          <Field label="Cédula / RIF titular">
            <TextInput value={pagomovil.cedula} onChange={(v) => setPagomovil((p) => ({ ...p, cedula: v }))} placeholder="V-00000000" />
          </Field>
        </div>
        {pagomovil.banco && pagomovil.numero && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 p-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Vista previa en el POS:</p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              📱 {pagomovil.banco} · {pagomovil.numero}{pagomovil.cedula ? ` · ${pagomovil.cedula}` : ''}
            </p>
          </div>
        )}
        <SaveBtn onClick={savePagomovil} saved={savedPagomovil} />
      </Section>

      {/* ── 4. Métodos de pago ── */}
      <Section
        title="💳 Métodos de pago habilitados"
        subtitle="Activa o desactiva los métodos disponibles en el POS. Al menos uno debe estar activo."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(METODOS_LABEL) as PaymentMethodKey[]).map((key) => (
            <label
              key={key}
              className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors ${
                metodos[key]
                  ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{METODOS_LABEL[key]}</p>
                {key === 'fiado' && (
                  <p className="text-xs text-slate-400">Requiere módulo de Deudas activo</p>
                )}
              </div>
              <div
                onClick={() => {
                  const enabled = Object.values({ ...metodos, [key]: !metodos[key] }).filter(Boolean).length;
                  if (!metodos[key] || enabled > 0) {
                    setMetodos((p) => ({ ...p, [key]: !p[key] }));
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  metodos[key] ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  metodos[key] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          ))}
        </div>
        <SaveBtn onClick={saveMetodos} saved={savedMetodos} />
      </Section>

      {/* ── 5. Alertas y límites ── */}
      <Section
        title="🔔 Alertas y límites globales"
        subtitle="Umbrales que disparan alertas automáticas en inventario, deudas y morosidad."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Stock mínimo global (uds.)"
            hint="Alerta cuando un producto cae por debajo de este stock."
          >
            <TextInput
              type="number"
              value={alertas.stock_minimo}
              onChange={(v) => setAlertas((p) => ({ ...p, stock_minimo: v }))}
              placeholder="5"
            />
          </Field>
          <Field
            label="Días de alerta de morosidad"
            hint="Alerta cuando un cliente supera este número de días sin abonar."
          >
            <TextInput
              type="number"
              value={alertas.dias_morosidad}
              onChange={(v) => setAlertas((p) => ({ ...p, dias_morosidad: v }))}
              placeholder="30"
            />
          </Field>
          <Field
            label="Límite de deuda global (Bs)"
            hint="Límite de crédito por defecto para clientes nuevos."
          >
            <TextInput
              type="number"
              value={alertas.limite_deuda}
              onChange={(v) => setAlertas((p) => ({ ...p, limite_deuda: v }))}
              placeholder="5000"
            />
          </Field>
        </div>
        <SaveBtn onClick={saveAlertas} saved={savedAlertas} />
      </Section>

      {/* ── 6. Zona de peligro ── */}
      <Section
        title="⚠️ Zona de peligro"
        subtitle="Acciones irreversibles. Úsalas con precaución."
      >
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
          >
            Restablecer configuración por defecto
          </button>
        ) : (
          <div className="rounded-xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              ¿Estás seguro? Esto restablecerá <span className="underline">toda la configuración</span> a los valores por defecto.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Sí, restablecer
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Section>

      <RateHistorySection />
    </div>
  );
}

// ─── Historial de tasas ───────────────────────────────────────────────────────

function RateHistorySection() {
  const { history } = useRateHistory();

  if (history.length === 0) {
    return (
      <Section title="Historial de tasas" subtitle="Evolución de la tasa Bs/USD registrada">
        <p className="text-sm text-slate-400">
          Aún no hay historial. Actualiza la tasa desde esta página para comenzar a registrar.
        </p>
      </Section>
    );
  }

  // Últimas 30 entradas
  const entries = [...history].slice(0, 30).reverse();
  const max = Math.max(...entries.map(e => e.rate));
  const min = Math.min(...entries.map(e => e.rate));
  const range = max - min || 1;

  // SVG sparkline
  const W = 500;
  const H = 80;
  const pts = entries.map((e, i) => {
    const x = (i / (entries.length - 1)) * (W - 20) + 10;
    const y = H - 10 - ((e.rate - min) / range) * (H - 20);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <Section title="Historial de tasas" subtitle="Últimas actualizaciones de la tasa Bs/USD">
      <div className="space-y-4">
        {/* Gráfica */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Mín: {min.toFixed(2)} Bs</span>
            <span className="text-xs font-semibold text-slate-500">Máx: {max.toFixed(2)} Bs</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
            <polyline
              points={pts}
              fill="none"
              stroke="rgb(99,102,241)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {entries.map((e, i) => {
              const x = (i / (entries.length - 1)) * (W - 20) + 10;
              const y = H - 10 - ((e.rate - min) / range) * (H - 20);
              return (
                <circle key={i} cx={x} cy={y} r="3" fill="rgb(99,102,241)">
                  <title>{e.rate.toFixed(2)} Bs — {new Date(e.fecha).toLocaleString('es-VE')}</title>
                </circle>
              );
            })}
          </svg>
        </div>

        {/* Tabla últimas 10 */}
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {[...history].slice(0, 10).map((e, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-bold text-slate-900 dark:text-white">{e.rate.toFixed(2)} Bs/USD</span>
              <span className="text-xs text-slate-400">
                {new Date(e.fecha).toLocaleString('es-VE', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
