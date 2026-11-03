import { useState, type ChangeEvent } from 'react';
import { importCatalogInventory } from '../lib/inventory-import-api';
import { parseInventoryWorkbook, type InventoryImportRow } from '../lib/inventory-import';
import { isSupabaseConfigured } from '../lib/supabase';

export function InventoryImport({ embedded = false }: { embedded?: boolean }) {
  const [rows, setRows] = useState<InventoryImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError('');
    setNotice('');
    setRows([]);
    setFileName('');
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError('Usa un archivo .xlsx, .xls o .csv.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera el máximo permitido de 10 MB.');
      return;
    }

    setIsLoading(true);
    try {
      const parsed = parseInventoryWorkbook(await file.arrayBuffer());
      setRows(parsed);
      setFileName(file.name);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : 'No se pudo leer el archivo.';
      setError(message.startsWith('IMPORT_') ? message : `No se pudo procesar el archivo: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function commitImport() {
    if (!isSupabaseConfigured) {
      setError('La importación requiere el backend Supabase configurado.');
      return;
    }
    if (!rows.length || rows.some((row) => row.errors.length)) return;
    setError('');
    setNotice('');
    setIsCommitting(true);
    try {
      const imported = await importCatalogInventory(rows);
      setNotice(`Importación completa: ${imported} productos procesados en una sola transacción.`);
      setRows([]);
      setFileName('');
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'No se pudo completar la importación.');
    } finally {
      setIsCommitting(false);
    }
  }

  const invalidCount = rows.filter((row) => row.errors.length > 0).length;

  return (
    <div className={`space-y-5 ${embedded ? '' : 'p-4 md:p-6'}`}>
      {!embedded && <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Importar inventario</h2>
        <p className="text-sm text-slate-500">Carga Excel con vista previa y validación antes de actualizar el catálogo.</p>
      </div>}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold">Columnas requeridas: Código, Nombre, Categoría, Precio Bs, Costo Bs y Stock.</p>
        <p className="text-xs text-slate-500">
          El stock del archivo se considera cantidad final. Los existentes se ajustan mediante el libro de movimientos;
          el nombre, categoría, precio y costo se actualizan. Máximo 500 filas y 10 MB.
        </p>
        <label className="inline-flex cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">
          {isLoading ? 'Leyendo archivo...' : 'Seleccionar .xlsx, .xls o .csv'}
          <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" disabled={isLoading || isCommitting} onChange={(event) => void handleFile(event)} />
        </label>
        {fileName && <span className="ml-3 text-sm text-slate-500">{fileName}</span>}
      </section>

      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">{notice}</div>}

      {rows.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
            <div>
              <h3 className="font-bold">Vista previa: {rows.length} filas</h3>
              <p className={`text-xs ${invalidCount ? 'text-red-600' : 'text-green-700'}`}>
                {invalidCount ? `${invalidCount} filas requieren corrección.` : 'Todas las filas son válidas.'}
              </p>
            </div>
            <button type="button" onClick={() => void commitImport()} disabled={Boolean(invalidCount) || isCommitting} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {isCommitting ? 'Importando...' : 'Confirmar importación'}
            </button>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                <tr>
                  {['Fila', 'Código', 'Nombre', 'Categoría', 'Precio Bs', 'Costo Bs', 'Stock final', 'Validación'].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-xs font-bold text-slate-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.rowNumber} className={row.errors.length ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.code}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{Number.isFinite(row.priceBs) ? row.priceBs.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2">{Number.isFinite(row.costBs) ? row.costBs.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2">{Number.isFinite(row.stock) ? row.stock : '—'}</td>
                    <td className="px-3 py-2 text-xs text-red-700 dark:text-red-300">{row.errors.join(' ') || 'Correcta'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
