import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { listSuppliers, saveSupplier, setSupplierActive, type Supplier } from '../lib/management-api';

const emptySupplier = { name: '', tax_id: '', contact_name: '', phone: '', email: '', address: '', notes: '' };

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(emptySupplier);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setSuppliers(await listSuppliers());
      setError('');
    } catch {
      setError('No se pudo cargar proveedores. Comprueba que la migración local esté desplegada y que tu cuenta sea dueña.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  function startEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      tax_id: supplier.tax_id ?? '',
      contact_name: supplier.contact_name ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
    setNotice('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      await saveSupplier({
        ...form,
        id: editingId,
        tax_id: form.tax_id.trim() || null,
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      });
      setForm(emptySupplier);
      setEditingId(undefined);
      setNotice('Proveedor guardado.');
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el proveedor.');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(supplier: Supplier) {
    setError('');
    try {
      await setSupplierActive(supplier.id, !supplier.active);
      await refresh();
    } catch {
      setError('No se pudo cambiar el estado del proveedor.');
    }
  }

  const visibleSuppliers = suppliers.filter((supplier) => showInactive || supplier.active);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Proveedores</h2>
        <p className="text-sm text-slate-500">Administra contactos y conserva registros inactivos para mantener trazabilidad.</p>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30">{notice}</div>}

      <form onSubmit={(event) => void submit(event)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <h3 className="font-bold md:col-span-2">{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
        {([
          ['name', 'Razón social / nombre *'],
          ['tax_id', 'RIF'],
          ['contact_name', 'Persona de contacto'],
          ['phone', 'Teléfono'],
          ['email', 'Correo'],
          ['address', 'Dirección'],
        ] as const).map(([key, label]) => (
          <label key={key} className="text-xs font-semibold text-slate-500">
            {label}
            <input required={key === 'name'} type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
        ))}
        <label className="text-xs font-semibold text-slate-500 md:col-span-2">
          Notas
          <textarea value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <div className="flex gap-2 md:col-span-2">
          <button disabled={isSaving} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{isSaving ? 'Guardando...' : 'Guardar proveedor'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(undefined); setForm(emptySupplier); }} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button>}
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-bold">Directorio ({visibleSuppliers.length})</h3>
          <label className="text-xs"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Mostrar inactivos</label>
        </div>
        {isLoading ? <p className="p-4 text-sm text-slate-500">Cargando...</p> : visibleSuppliers.length === 0 ? <p className="p-4 text-sm text-slate-500">No hay proveedores.</p> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleSuppliers.map((supplier) => (
              <div key={supplier.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{supplier.name}{!supplier.active && <span className="ml-2 text-xs text-slate-400">Inactivo</span>}</p>
                  <p className="text-xs text-slate-500">{[supplier.tax_id, supplier.contact_name, supplier.phone, supplier.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(supplier)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Editar</button>
                  <button type="button" onClick={() => void toggleActive(supplier)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">{supplier.active ? 'Desactivar' : 'Activar'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
