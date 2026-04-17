import { Button, Card, Spinner } from '@heroui/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebts, type DebtItem } from '../lib/debts-context';
import { useExchangeRate } from '../lib/exchange-rate';
import { useI18n } from '../lib/i18n';
import { useRateHistory } from '../lib/rate-history';
import { MOCK_PRODUCTS } from '../mocks/products';
import { useSalesHistory } from '../lib/sales-history';
import { useCashierShift } from '../lib/cashier-shift';

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
};

type CartItem = Product & { qty: number };
type PaymentMethod = 'efectivo_bs' | 'efectivo_usd' | 'pagomovil' | 'tarjeta' | 'punto_venta' | 'mixto' | 'fiado';

type PagoMovilData = {
  referencia: string;
  banco: string;
  monto_efectivo: string;
  moneda_efectivo: 'bs' | 'usd';
};

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const CAJERO_ACTUAL = 'Alex Morgan'; // TODO: reemplazar con auth real

const BANCOS_VE = [
  'Banesco', 'Banco de Venezuela', 'Mercantil', 'BBVA Provincial',
  'Banco del Tesoro', 'BNC', 'Bancamiga', 'Bicentenario', 'Otro',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moneyUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}
function moneyBs(value: number, rate: number): string {
  return rate > 0 ? `${(value * rate).toFixed(2)} Bs` : `${value.toFixed(2)} Bs`;
}

function formatPrice(priceUsd: number, rate: number): JSX.Element {
  const priceBs = rate > 0 ? priceUsd * rate : priceUsd;
  return (
    <>
      <p className="font-bold text-slate-900 dark:text-white">${priceUsd.toFixed(2)}</p>
      <p className="text-xs text-slate-500">{priceBs.toFixed(2)} Bs</p>
    </>
  );
}

function formatPriceBsFirst(priceBs: number, rate: number): JSX.Element {
  const priceUsd = rate > 0 ? priceBs / rate : 0;
  return (
    <>
      <p className="font-bold text-slate-900 dark:text-white">${priceUsd.toFixed(2)}</p>
      <p className="text-xs text-slate-500">{priceBs.toFixed(2)} Bs</p>
    </>
  );
}

// ─── Modal Pago Móvil / Mixto ─────────────────────────────────────────────────

function ModalPagoMovil({
  isMixto,
  total,
  onConfirm,
  onCancel,
}: {
  isMixto: boolean;
  total: number;
  onConfirm: (data: PagoMovilData) => void;
  onCancel: () => void;
}) {
  const [referencia, setReferencia] = useState('');
  const [banco, setBanco] = useState('');
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [moneda, setMoneda] = useState<'bs' | 'usd'>('bs');
  const [err, setErr] = useState('');

  function handleConfirm() {
    setErr('');
    if (!/^\d{6}$/.test(referencia.trim())) {
      setErr('La referencia debe ser exactamente 6 dígitos numéricos.');
      return;
    }
    if (!banco) {
      setErr('Selecciona el banco emisor del pago móvil.');
      return;
    }
    if (isMixto) {
      const m = Number(montoEfectivo);
      if (!montoEfectivo || isNaN(m) || m <= 0) {
        setErr('Ingresa el monto cancelado en efectivo.');
        return;
      }
    }
    onConfirm({ referencia: referencia.trim(), banco, monto_efectivo: montoEfectivo, moneda_efectivo: moneda });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-1 text-lg font-extrabold text-slate-900 dark:text-white">
          {isMixto ? '💳 Pago Mixto' : '📱 Pago Móvil'}
        </h3>
        <p className="mb-5 text-sm text-slate-500">
          Monto total:{' '}
          <span className="font-bold text-slate-800 dark:text-white">{moneyBs(total)}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Últimos 6 dígitos de la referencia *
            </label>
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Banco emisor *
            </label>
            <select
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Seleccionar banco...</option>
              {BANCOS_VE.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {isMixto && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Efectivo adicional
              </p>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">
                  Monto cancelado en efectivo *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoEfectivo}
                  onChange={(e) => setMontoEfectivo(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-500">Moneda del efectivo</label>
                <div className="flex gap-2">
                  {(['bs', 'usd'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoneda(m)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                        moneda === m
                          ? 'bg-primary text-white'
                          : 'bg-slate-200 text-slate-600 hover:opacity-80 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m === 'bs' ? 'Bolívares (Bs)' : 'Dólares (USD)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {err && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
              ⚠️ {err}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Fiado ──────────────────────────────────────────────────────────────

function ModalFiado({
  debts,
  total,
  onConfirm,
  onCancel,
  onAddClient,
}: {
  debts: DebtItem[];
  total: number;
  onConfirm: (clientId: number) => void;
  onCancel: () => void;
  onAddClient: (nombre: string, telefono: string, limite: number) => DebtItem;
}) {
  const [tab, setTab] = useState<'search' | 'new'>('search');
  const [query, setQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [newNombre, setNewNombre] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newLimite, setNewLimite] = useState('5000');
  const [err, setErr] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return debts;
    return debts.filter(
      (d) =>
        d.nombre.toLowerCase().includes(term) ||
        (d.telefono ?? '').includes(term)
    );
  }, [debts, query]);

  function moneyBs(v: number) { return `${v.toFixed(2)} Bs`; }

  function handleConfirm() {
    setErr('');
    if (tab === 'search') {
      if (!selectedClientId) { setErr('Selecciona un cliente.'); return; }
      onConfirm(selectedClientId);
    } else {
      if (!newNombre.trim()) { setErr('El nombre es obligatorio.'); return; }
      const limite = Number(newLimite);
      if (isNaN(limite) || limite <= 0) { setErr('Ingresa un límite válido.'); return; }
      const client = onAddClient(newNombre.trim(), newTelefono.trim(), limite);
      onConfirm(client.id);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-1 text-lg font-extrabold text-slate-900 dark:text-white">📋 Venta Fiada</h3>
        <p className="mb-5 text-sm text-slate-500">
          Monto: <span className="font-bold text-slate-800 dark:text-white">{moneyBs(total)}</span>
        </p>

        {/* Tabs */}
        <div className="mb-4 flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
          {[{ key: 'search', label: 'Cliente existente' }, { key: 'new', label: 'Nuevo cliente' }].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTab(key as 'search' | 'new'); setErr(''); }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                tab === key ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'search' ? (
          <div className="space-y-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  {debts.length === 0 ? 'No hay clientes. Crea uno nuevo.' : 'Sin resultados.'}
                </p>
              ) : filtered.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedClientId(d.id)}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                    selectedClientId === d.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{d.nombre}</p>
                  <p className="text-xs text-slate-400">
                    {d.telefono ?? 'Sin teléfono'} · Deuda: {moneyBs(d.deuda_total)} / {moneyBs(d.limite_credito)}
                  </p>
                  {d.deuda_total + total > d.limite_credito && (
                    <p className="mt-0.5 text-xs font-semibold text-warning">⚠️ Superaría el límite de crédito</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Nombre *</label>
              <input type="text" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder="Ej. Juan García"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Teléfono</label>
              <input type="text" value={newTelefono} onChange={(e) => setNewTelefono(e.target.value)} placeholder="0414-0000000"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Límite de crédito (Bs) *</label>
              <input type="number" value={newLimite} onChange={(e) => setNewLimite(e.target.value)} placeholder="5000"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
          </div>
        )}

        {err && (
          <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
            ⚠️ {err}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90">
            Confirmar fiado
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banner de venta exitosa ──────────────────────────────────────────────────

function BannerVentaExitosa({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-success/30 bg-white p-6 shadow-2xl dark:border-success/20 dark:bg-slate-900 text-center">
        <div className="mb-3 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success/10 text-3xl">
            ✅
          </div>
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">¡Venta registrada!</h3>
        <p className="mt-1 text-sm text-slate-500">La venta fue procesada correctamente.</p>

        <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID de venta</p>
          <p className="mt-0.5 font-mono text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
            {saleId}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales-history')}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Ver historial de ventas
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main POS ─────────────────────────────────────────────────────────────────

export function Pos() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { rate, updatedAt, isStale } = useExchangeRate();
  const { pushRate } = useRateHistory();
  const { addSale } = useSalesHistory();
  const { addShift } = useCashierShift();
  const { debts, addClient, addDebt } = useDebts();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPagoMovilModal, setShowPagoMovilModal] = useState(false);
  const [showFiadoModal, setShowFiadoModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [catalogPage, setCatalogPage] = useState(1);
  const CATALOG_PAGE_SIZE = 12;

  // Registrar tasa actual en historial al montar
  useEffect(() => {
    if (rate > 0) pushRate(rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = (await res.json().catch(() => [])) as unknown;
      if (!res.ok) throw new Error('load');
      setProducts(Array.isArray(data) ? (data as Product[]) : []);
      setIsFallbackMode(false);
    } catch {
      setProducts(MOCK_PRODUCTS);
      setIsFallbackMode(true);
      setError(t('pos.error.loadProducts'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadProducts(); }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        String(p.id).includes(term),
    );
  }, [products, query]);

  useEffect(() => { setCatalogPage(1); }, [query]);

  const total = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.qty, 0), [cart]);
  const totalUsd = rate > 0 ? total / rate : 0;
  const totalBs = total;

  const totalCatalogPages = Math.max(1, Math.ceil(filteredProducts.length / CATALOG_PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (catalogPage - 1) * CATALOG_PAGE_SIZE;
    return filteredProducts.slice(start, start + CATALOG_PAGE_SIZE);
  }, [filteredProducts, catalogPage]);

  const updatedLabel = new Date(updatedAt).toLocaleString('es-VE', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  function addToCart(product: Product) {
    setCart((prev) => {
      const current = prev.find((p) => p.id === product.id);
      if ((current?.qty ?? 0) >= product.stock) return prev;
      if (current) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item;
          const maxStock = products.find((p) => p.id === item.id)?.stock ?? item.stock;
          return { ...item, qty: Math.max(0, Math.min(maxStock, item.qty + delta)) };
        })
        .filter((item) => item.qty > 0),
    );
  }

  function handleCheckout() {
    setError('');
    if (cart.length === 0) { setError(t('pos.error.emptyCart')); return; }
    if (!paymentMethod) { setError(t('pos.error.noPayment')); return; }
    if (paymentMethod === 'pagomovil' || paymentMethod === 'mixto') {
      setShowPagoMovilModal(true);
      return;
    }
    if (paymentMethod === 'fiado') {
      setShowFiadoModal(true);
      return;
    }
    void submitSale({});
  }

  async function submitSale(extra: Partial<PagoMovilData>, fromCloseShift = false) {
    setIsSubmitting(true);
    setShowPagoMovilModal(false);

    // Guardar en historial local (siempre funciona)
    const record = addSale({
      cajero: CAJERO_ACTUAL,
      metodo: paymentMethod!,
      total,
      productos: cart.map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
      referencia: extra.referencia,
      banco: extra.banco,
      monto_efectivo: extra.monto_efectivo ? Number(extra.monto_efectivo) : undefined,
      moneda_efectivo: extra.moneda_efectivo,
    });

    // Intentar enviar al backend (silencioso si falla)
    try {
      const body: Record<string, unknown> = {
        sale_id: record.id,
        cajero: CAJERO_ACTUAL,
        productos: cart.map((item) => ({ id: item.id, qty: item.qty })),
        metodo: paymentMethod,
        total,
      };
      if (extra.referencia) body.referencia = extra.referencia;
      if (extra.banco) body.banco = extra.banco;
      if (extra.monto_efectivo) body.monto_efectivo = Number(extra.monto_efectivo);
      if (extra.moneda_efectivo) body.moneda_efectivo = extra.moneda_efectivo;

      await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      // silencioso
    } finally {
      setIsSubmitting(false);
    }

    // Registrar cierre de caja si se realizó desde el botón de cierre
    if (fromCloseShift) {
      const salesByMethod = cart.reduce((acc, item) => {
        const methodKey = paymentMethod || 'efectivo_bs';
        acc[methodKey] = (acc[methodKey] || 0) + (item.price * item.qty);
        return acc;
      }, {} as Record<string, number>);

      addShift({
        cajero: CAJERO_ACTUAL,
        totalVentas: total,
        totalVentasUsd: totalUsd,
        cantidadVentas: 1,
        efectivoBs: paymentMethod === 'efectivo_bs' ? total : 0,
        efectivoUsd: paymentMethod === 'efectivo_usd' ? totalUsd : 0,
        pagoMovil: paymentMethod === 'pagomovil' ? total : 0,
        tarjeta: paymentMethod === 'tarjeta' ? total : 0,
        puntoVenta: paymentMethod === 'punto_venta' ? total : 0,
        fiado: paymentMethod === 'fiado' ? total : 0,
        mixto: paymentMethod === 'mixto' ? total : 0,
        tasaCierre: rate,
      });
    }

    setLastSaleId(record.id);
    setCart([]);
    setPaymentMethod(null);
    await loadProducts();
  }

  async function submitFiado(clientId: number) {
    setShowFiadoModal(false);
    setIsSubmitting(true);
    const record = addSale({
      cajero: CAJERO_ACTUAL,
      metodo: 'fiado',
      total,
      productos: cart.map((item) => ({ id: item.id, name: item.name, qty: item.qty, price: item.price })),
    });
    addDebt(clientId, total, record.id);
    try {
      await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_id: record.id, cajero: CAJERO_ACTUAL, productos: cart.map((i) => ({ id: i.id, qty: i.qty })), metodo: 'fiado', total, cliente_id: clientId }),
      });
    } catch { /* silencioso */ }
    setIsSubmitting(false);
    setLastSaleId(record.id);
    setCart([]);
    setPaymentMethod(null);
    await loadProducts();
  }

  const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
    { key: 'efectivo_bs', label: 'Efectivo Bs', icon: '💵' },
    { key: 'efectivo_usd', label: 'Efectivo USD', icon: '💰' },
    { key: 'pagomovil', label: 'Pago Móvil', icon: '📱' },
    { key: 'tarjeta', label: 'Tarjeta', icon: '💳' },
    { key: 'punto_venta', label: 'Punto de Venta', icon: '🏪' },
    { key: 'mixto', label: 'Pago Mixto', icon: '🔀' },
    { key: 'fiado', label: 'Fiado', icon: '📋' },
  ];

  return (
    <>
      {showPagoMovilModal && (
        <ModalPagoMovil
          isMixto={paymentMethod === 'mixto'}
          total={total}
          onConfirm={(data) => void submitSale(data)}
          onCancel={() => setShowPagoMovilModal(false)}
        />
      )}

      {showFiadoModal && (
        <ModalFiado
          debts={debts}
          total={total}
          onConfirm={(clientId) => void submitFiado(clientId)}
          onCancel={() => setShowFiadoModal(false)}
          onAddClient={(nombre, telefono, limite) => addClient({ nombre, telefono, limite_credito: limite })}
        />
      )}

      {lastSaleId && (
        <BannerVentaExitosa
          saleId={lastSaleId}
          onClose={() => setLastSaleId(null)}
        />
      )}

      <div className="p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">

          {/* ── Catálogo ── */}
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('pos.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('pos.subtitle')}</p>
            </div>

            {/* Tasa — solo lectura, click navega a Settings */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('rate.label')}
                  </p>
                  <p className={`text-lg font-extrabold ${isStale ? 'text-warning' : 'text-slate-900 dark:text-white'}`}>
                    {rate.toFixed(2)} Bs/USD
                  </p>
                  <p className={`text-xs font-medium ${isStale ? 'text-warning' : 'text-slate-400'}`}>
                    {t('rate.updatedAt')}: {updatedLabel}
                    {isStale && ' · ⚠️ Actualiza la tasa'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">Editar →</span>
              </div>
            </button>

            {error && (
              <div className="rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {isFallbackMode && (
              <div className="rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 text-xs font-semibold text-warning">
                {t('pos.fallback.notice')}
              </div>
            )}

            {/* Búsqueda */}
            <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
              <Card.Content className="p-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t('pos.search.label')}
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('pos.search.placeholder')}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </Card.Content>
            </Card>

            {/* Catálogo */}
            <Card className="border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
              <Card.Header className="px-4 pb-0 pt-4">
                <Card.Title>{t('pos.catalog.title')}</Card.Title>
              </Card.Header>
              <Card.Content className="p-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 py-3">
                    <Spinner size="sm" />
                    <p className="text-sm text-slate-500">{t('pos.loading')}</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('pos.catalog.empty')}</p>
                ) : (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {paginatedProducts.map((product) => (
                        <div key={product.id} className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</p>
                            <p className="text-xs text-slate-500">#{product.id} · {product.category}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              {formatPriceBsFirst(product.price, rate)}
                            </div>
                            <span className="text-xs text-slate-500">{t('pos.stock')}: {product.stock}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="tertiary"
                            fullWidth
                            isDisabled={product.stock <= 0}
                            onPress={() => addToCart(product)}
                          >
                            {product.stock <= 0 ? t('pos.outOfStock') : t('pos.add')}
                          </Button>
                        </div>
                      ))}
                    </div>
                    {/* Paginación catálogo */}
                    {totalCatalogPages > 1 && (
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                        <Button
                          size="sm" variant="ghost"
                          isDisabled={catalogPage <= 1}
                          onPress={() => setCatalogPage(p => p - 1)}
                        >← Anterior</Button>
                        <p className="text-xs font-semibold text-slate-500">
                          {catalogPage} / {totalCatalogPages} · {filteredProducts.length} productos
                        </p>
                        <Button
                          size="sm" variant="ghost"
                          isDisabled={catalogPage >= totalCatalogPages}
                          onPress={() => setCatalogPage(p => p + 1)}
                        >Siguiente →</Button>
                      </div>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* ── Ticket ── */}
          <Card className="h-fit border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
            <Card.Header className="px-4 pb-0 pt-4">
              <Card.Title>{t('pos.ticket.title')}</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4 p-4">
              {cart.length === 0 ? (
                <p className="text-sm text-slate-500">{t('pos.ticket.empty')}</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">${((item.price * item.qty) / rate).toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{(item.price * item.qty).toFixed(2)} Bs</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">${(item.price / rate).toFixed(2)} c/u</p>
                          <p className="text-xs text-slate-500">{item.price.toFixed(2)} Bs</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onPress={() => updateQty(item.id, -1)}>-</Button>
                          <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                          <Button size="sm" variant="ghost" onPress={() => updateQty(item.id, 1)}>+</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="text-sm font-semibold">{t('pos.payment.title')}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAYMENT_METHODS.map(({ key, label, icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentMethod(key)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-4 transition-all ${
                        paymentMethod === key
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-bold text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                <span className="text-lg font-extrabold">{t('pos.total')}</span>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white">${totalUsd.toFixed(2)}</p>
                  <p className="text-sm font-semibold text-slate-500">{totalBs.toFixed(2)} Bs</p>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                isDisabled={isSubmitting || cart.length === 0}
                onPress={handleCheckout}
              >
                {isSubmitting ? t('pos.checkout.loading') : t('pos.checkout.action')}
              </Button>

              <Button
                variant="secondary"
                fullWidth
                onPress={() => {
                  if (cart.length === 0) { setError(t('pos.error.emptyCart')); return; }
                  if (!confirm('¿Estás seguro de realizar el cierre de caja? Se registrará la venta actual.')) return;
                  handleCheckout();
                }}
              >
                📪 Cierre de caja
              </Button>
            </Card.Content>
          </Card>

        </div>
      </div>
    </>
  );
}
