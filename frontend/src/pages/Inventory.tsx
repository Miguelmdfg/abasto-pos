import { Button, Card, Dropdown, Spinner } from '@heroui/react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useExchangeRate } from '../lib/exchange-rate';
import { useAuth } from '../lib/auth';
import { SectionTabs } from '../components/SectionTabs';
import {
  adjustCatalogStock,
  canUseDemoCatalog,
  loadCatalogProducts,
  type CatalogProduct,
  upsertCatalogProduct,
} from '../lib/catalog';

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = CatalogProduct;

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;
const InventoryImportPanel = lazy(() => import('./InventoryImport').then(({ InventoryImport }) => ({ default: InventoryImport })));

const emptyForm = { name: '', category: '', price: '0', costo: '0', stock: '0' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPriceBsFirst(priceBs: number, rate: number): ReactElement {
  const priceUsd = rate > 0 ? priceBs / rate : 0;
  return (
    <>
      <p className="font-bold text-slate-900 dark:text-white">${priceUsd.toFixed(2)}</p>
      <p className="text-xs text-slate-500">{priceBs.toFixed(2)} Bs</p>
    </>
  );
}

function getStockClass(stock: number): string {
  if (stock <= 0) return 'bg-danger/10 text-danger border border-danger/20';
  if (stock <= 5) return 'bg-warning/10 text-warning border border-warning/20';
  return 'bg-success/10 text-success border border-success/20';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldInput({
  label, value, onChange, placeholder, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Inventory() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { rate } = useExchangeRate();
  const canImport = user?.role === 'dueno';
  const activeTab = searchParams.get('tab') === 'import' && canImport ? 'import' : 'products';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Filtros
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'stock' | 'price'>('recent');
  const [page, setPage] = useState(1);

  // Formulario de creación/edición
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edición de stock inline
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockEditValue, setStockEditValue] = useState('');
  const [stockEditReason, setStockEditReason] = useState('Ajuste manual');

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setProducts(await loadCatalogProducts());
      setIsFallbackMode(canUseDemoCatalog);
    } catch {
      setProducts([]);
      setIsFallbackMode(false);
      setError(t('inventory.error.load'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (activeTab === 'products') void loadProducts();
  }, [activeTab, loadProducts]);

  useEffect(() => {
    if (searchParams.get('tab') === 'import' && !canImport) setSearchParams({}, { replace: true });
  }, [canImport, searchParams, setSearchParams]);

  // ── Filtros y paginación ──────────────────────────────────────────────────

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => { if (p.category?.trim()) s.add(p.category.trim()); });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const processedProducts = useMemo(() => {
    const text = query.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (stockFilter === 'inStock' && p.stock <= 5) return false;
      if (stockFilter === 'low' && (p.stock <= 0 || p.stock > 5)) return false;
      if (stockFilter === 'out' && p.stock > 0) return false;
      if (!text) return true;
      return (
        p.name.toLowerCase().includes(text) ||
        p.category.toLowerCase().includes(text) ||
        String(p.id).includes(text)
      );
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return b.stock - a.stock;
      if (sortBy === 'price') return b.price - a.price;
      return b.id.localeCompare(a.id);
    });
    return sorted;
  }, [products, query, categoryFilter, stockFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedProducts.length / PAGE_SIZE));

  useEffect(() => { setPage(1); }, [query, categoryFilter, stockFilter, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedProducts.slice(start, start + PAGE_SIZE);
  }, [page, processedProducts]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function startCreate() {
    setEditingId(null);
    setFormError('');
    setForm(emptyForm);
    setShowForm(true);
    setStockEditId(null);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setFormError('');
    setForm({
      name: product.name,
      category: product.category,
      price: rate > 0 ? (product.price / rate).toFixed(2) : '0',
      costo: rate > 0 ? ((product.costo ?? 0) / rate).toFixed(2) : '0',
      stock: String(product.stock),
    });
    setShowForm(true);
    setStockEditId(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  }

  async function saveProduct() {
    setFormError('');
    const name = form.name.trim();
    const category = form.category.trim();
    const priceUsd = Number(form.price);
    const costoUsd = Number(form.costo);
    const stock = Number(form.stock);

    if (!name || !category) { setFormError(t('inventory.form.error.required')); return; }
    if (rate <= 0 || !Number.isFinite(priceUsd) || priceUsd < 0 || !Number.isFinite(costoUsd) || costoUsd < 0 || !Number.isFinite(stock) || stock < 0) {
      setFormError(t('inventory.form.error.invalidNumbers'));
      return;
    }
    setIsSaving(true);
    try {
      await upsertCatalogProduct({
        id: editingId ?? undefined,
        name,
        category,
        price: priceUsd * rate,
        costo: costoUsd * rate,
        stock,
      });
      await loadProducts();
      cancelForm();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Stock inline edit ─────────────────────────────────────────────────────

  function startStockEdit(product: Product) {
    setStockEditId(product.id);
    setStockEditValue(String(product.stock));
    setStockEditReason('Ajuste manual');
    if (showForm) cancelForm();
  }

  async function commitStockEdit(product: Product) {
    const newStock = Math.max(0, Math.floor(Number(stockEditValue)));
    if (!Number.isFinite(newStock) || newStock === product.stock) {
      setStockEditId(null);
      return;
    }
    const reason = stockEditReason.trim();
    if (!reason) {
      setError('Indica el motivo del ajuste de stock.');
      setStockEditId(null);
      return;
    }
    const delta = newStock - product.stock;
    try {
      await adjustCatalogStock(product.id, delta, reason);
      await loadProducts();
      setStockEditId(null);
    } catch (stockError) {
      setError(stockError instanceof Error ? stockError.message : 'No se pudo ajustar el stock.');
    }
  }

  // ── Export CSV ────────────────────────────────────────────────────────────

  function exportCSV() {
    const rows = processedProducts.map(
      (p) => `${p.id},${p.name},${p.category},${rate > 0 ? (p.price / rate).toFixed(2) : '0.00'},${rate > 0 ? (p.costo / rate).toFixed(2) : '0.00'},${p.stock}`
    );
    const csv = ['id,name,category,price_usd,costo_usd,stock', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Labels para dropdowns ─────────────────────────────────────────────────

  const categoryLabel = categoryFilter === 'all' ? t('inventory.filter.allCategories') : categoryFilter;
  const stockLabel =
    stockFilter === 'all' ? t('inventory.filter.allStock') :
    stockFilter === 'inStock' ? t('inventory.stock.ok') :
    stockFilter === 'low' ? t('inventory.stock.low') :
    t('inventory.stock.out');
  const sortLabel =
    sortBy === 'recent' ? t('inventory.sort.recent') :
    sortBy === 'name' ? t('inventory.sort.name') :
    sortBy === 'stock' ? t('inventory.sort.stock') :
    t('inventory.sort.price');

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-5">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('inventory.title')}
          </h2>
          <p className="text-sm text-slate-500">{t('inventory.subtitle')}</p>
        </div>

        <SectionTabs
          tabs={[
            { id: 'products', label: t('tabs.products') },
            ...(canImport ? [{ id: 'import', label: t('tabs.importInventory') }] : []),
          ]}
          activeTab={activeTab}
          onChange={(tab) => setSearchParams(tab === 'products' ? {} : { tab })}
        />

        <div id={`${activeTab}-panel`} role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
        {activeTab === 'products' ? <div className="space-y-4">
        {error && (
          <Card className="border border-danger/40 bg-danger/5 shadow-sm">
            <Card.Content className="flex items-center justify-between gap-4 p-4">
              <p className="text-sm text-danger">{error}</p>
              <Button size="sm" variant="danger-soft" onPress={() => void loadProducts()}>
                {t('inventory.retry')}
              </Button>
            </Card.Content>
          </Card>
        )}

        {isFallbackMode && (
          <div className="rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 text-xs font-semibold text-warning">
            {t('inventory.fallback.notice')}
          </div>
        )}

        {/* Barra de acciones */}
        <Card className="border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Content className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-xl">
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                {t('inventory.search.label')}
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('inventory.search.placeholder')}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onPress={() => void loadProducts()}>{t('inventory.refresh')}</Button>
              <Button variant="tertiary" onPress={exportCSV}>{t('inventory.export')}</Button>
              <Button variant="primary" onPress={startCreate}>+ {t('inventory.form.new')}</Button>
            </div>
          </Card.Content>
        </Card>

        {/* Formulario crear/editar */}
        {showForm && (
          <Card className="border border-primary/20 bg-primary/5 shadow-sm dark:bg-primary/10">
            <Card.Header className="px-4 pb-0 pt-4">
              <Card.Title>
                {editingId ? t('inventory.form.editTitle') : t('inventory.form.createTitle')}
              </Card.Title>
            </Card.Header>
            <Card.Content className="p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <FieldInput
                  label={t('inventory.form.name')}
                  value={form.name}
                  onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                  placeholder={t('inventory.form.namePlaceholder')}
                />
                <FieldInput
                  label={t('inventory.form.category')}
                  value={form.category}
                  onChange={(v) => setForm((p) => ({ ...p, category: v }))}
                  placeholder={t('inventory.form.categoryPlaceholder')}
                />
                <FieldInput
                  label="Precio de venta ($)"
                  type="number"
                  value={form.price}
                  onChange={(v) => setForm((p) => ({ ...p, price: v }))}
                  placeholder="0.00"
                />
                <FieldInput
                  label="Costo ($)"
                  type="number"
                  value={form.costo}
                  onChange={(v) => setForm((p) => ({ ...p, costo: v }))}
                  placeholder="0.00"
                />
                <FieldInput
                  label={t('inventory.form.stock')}
                  type="number"
                  value={form.stock}
                  onChange={(v) => setForm((p) => ({ ...p, stock: v }))}
                  placeholder="0"
                />
                {/* Margen calculado en tiempo real */}
                {Number(form.price) > 0 && Number(form.costo) > 0 && (
                  <div className="flex items-end pb-1">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 w-full">
                      <p className="text-xs font-semibold text-slate-500">Margen</p>
                      <p className={`text-sm font-extrabold ${
                        Number(form.price) > Number(form.costo) ? 'text-success' : 'text-danger'
                      }`}>
                        {(((Number(form.price) - Number(form.costo)) / Number(form.price)) * 100).toFixed(1)}%
                        &nbsp;·&nbsp;${(Number(form.price) - Number(form.costo)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <p className="mt-3 text-sm text-danger">{formError}</p>
              )}

              <div className="mt-4 flex gap-2">
                <Button variant="primary" isDisabled={isSaving} onPress={() => void saveProduct()}>
                  {isSaving ? t('inventory.form.saving') : t('inventory.form.save')}
                </Button>
                <Button variant="ghost" onPress={cancelForm}>
                  {t('inventory.form.clear')}
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Tabla */}
        <Card className="border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 p-4">
            <Dropdown>
              <Dropdown.Trigger className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                {t('inventory.filter.category')}: {categoryLabel}
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu
                  aria-label="Category filter"
                  selectionMode="single"
                  selectedKeys={[categoryFilter]}
                  onSelectionChange={(keys) => {
                    const first = Array.from(keys)[0];
                    if (typeof first === 'string') setCategoryFilter(first);
                  }}
                >
                  <Dropdown.Item key="all">{t('inventory.filter.allCategories')}</Dropdown.Item>
                  {categories.map((c) => <Dropdown.Item key={c}>{c}</Dropdown.Item>)}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            <Dropdown>
              <Dropdown.Trigger className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                {t('inventory.filter.stock')}: {stockLabel}
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu
                  aria-label="Stock filter"
                  selectionMode="single"
                  selectedKeys={[stockFilter]}
                  onSelectionChange={(keys) => {
                    const first = Array.from(keys)[0];
                    if (first === 'all' || first === 'inStock' || first === 'low' || first === 'out') setStockFilter(first);
                  }}
                >
                  <Dropdown.Item key="all">{t('inventory.filter.allStock')}</Dropdown.Item>
                  <Dropdown.Item key="inStock">{t('inventory.stock.ok')}</Dropdown.Item>
                  <Dropdown.Item key="low">{t('inventory.stock.low')}</Dropdown.Item>
                  <Dropdown.Item key="out">{t('inventory.stock.out')}</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            <Dropdown>
              <Dropdown.Trigger className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                {t('inventory.filter.sortBy')}: {sortLabel}
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu
                  aria-label="Sort by"
                  selectionMode="single"
                  selectedKeys={[sortBy]}
                  onSelectionChange={(keys) => {
                    const first = Array.from(keys)[0];
                    if (first === 'recent' || first === 'name' || first === 'stock' || first === 'price') setSortBy(first);
                  }}
                >
                  <Dropdown.Item key="recent">{t('inventory.sort.recent')}</Dropdown.Item>
                  <Dropdown.Item key="name">{t('inventory.sort.name')}</Dropdown.Item>
                  <Dropdown.Item key="stock">{t('inventory.sort.stock')}</Dropdown.Item>
                  <Dropdown.Item key="price">{t('inventory.sort.price')}</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            <Button
              size="sm"
              variant="ghost"
              onPress={() => { setCategoryFilter('all'); setStockFilter('all'); setSortBy('recent'); }}
            >
              {t('inventory.filter.clear')}
            </Button>

            <span className="ml-auto text-xs font-semibold text-slate-500">
              {processedProducts.length} productos
            </span>
          </div>

        </Card>

        <Card className="overflow-hidden border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
          <Card.Content className="p-0">
            {isLoading ? (
              <div className="flex items-center gap-3 p-6">
                <Spinner size="sm" />
                <p className="text-sm text-slate-500">{t('inventory.loading')}</p>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">{t('inventory.list.empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                {/* Cabecera */}
                <div className="grid grid-cols-[1.4fr_1fr_0.6fr_0.7fr_0.7fr_0.6fr_1.1fr] items-center gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                  <span>{t('inventory.table.product')}</span>
                  <span>{t('inventory.table.category')}</span>
                  <span>Stock</span>
                  <span>Precio</span>
                  <span>Costo</span>
                  <span>Margen</span>
                  <span className="text-right">{t('inventory.table.actions')}</span>
                </div>
                {/* Filas */}
                <div className="space-y-2 p-3">
                  {paginatedProducts.map((product) => {
                    const margen = product.price > 0 && product.costo > 0
                      ? ((product.price - product.costo) / product.price) * 100
                      : null;
                    return (
                      <div
                        key={product.id}
                        className="grid grid-cols-[1.4fr_1fr_0.6fr_0.7fr_0.7fr_0.6fr_1.1fr] items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-5 py-4 text-sm transition-colors hover:border-primary/30 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-slate-400">#SKU-{product.id}</p>
                        </div>
                        <span className="w-fit rounded-md border border-slate-200 px-2 py-0.5 text-xs dark:border-slate-700">
                          {product.category}
                        </span>

                        {/* Stock editable inline */}
                        {stockEditId === product.id ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              min="0"
                              value={stockEditValue}
                              onChange={(e) => setStockEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void commitStockEdit(product);
                                if (e.key === 'Escape') setStockEditId(null);
                              }}
                              autoFocus
                              className="w-20 rounded-lg border border-primary px-2 py-1 text-xs font-bold focus:outline-none"
                            />
                            <input
                              type="text"
                              value={stockEditReason}
                              onChange={(e) => setStockEditReason(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void commitStockEdit(product);
                                if (e.key === 'Escape') setStockEditId(null);
                              }}
                              placeholder="Motivo"
                              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => void commitStockEdit(product)}
                              className="text-[10px] font-semibold text-primary"
                            >
                              Guardar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startStockEdit(product)}
                            title="Clic para editar stock"
                            className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold hover:opacity-70 ${getStockClass(product.stock)}`}
                          >
                            {product.stock}
                          </button>
                        )}

                        <div className="text-sm">
                          {formatPriceBsFirst(product.price, rate)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.costo > 0 ? formatPriceBsFirst(product.costo, rate) : <span>—</span>}
                        </div>
                        <span className={`text-xs font-bold ${
                          margen === null ? 'text-slate-400' :
                          margen < 0 ? 'text-danger' :
                          margen < 15 ? 'text-warning' : 'text-success'
                        }`}>
                          {margen !== null ? `${margen.toFixed(0)}%` : '—'}
                        </span>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onPress={() => startEdit(product)}>
                            {t('inventory.list.edit')}
                          </Button>
                          <button
                            onClick={() => startStockEdit(product)}
                            title="Editar stock"
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            📦
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </div>
            )}
          </Card.Content>

          {/* Paginación */}
          {!isLoading && processedProducts.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <Button size="sm" variant="ghost" isDisabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
                {t('inventory.pagination.prev')}
              </Button>
              <p className="text-xs font-semibold text-slate-500">
                {t('inventory.pagination.page')} {page} / {totalPages}
              </p>
              <Button size="sm" variant="ghost" isDisabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
                {t('inventory.pagination.next')}
              </Button>
            </div>
          )}
        </Card>
        </div> : <Suspense fallback={<p className="py-8 text-center text-sm text-slate-500" role="status">Cargando importación...</p>}>
          <InventoryImportPanel embedded />
        </Suspense>}
        </div>
      </div>
    </div>
  );
}
