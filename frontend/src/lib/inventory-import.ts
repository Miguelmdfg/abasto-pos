import * as XLSX from '@e965/xlsx';

export type InventoryImportRow = {
  rowNumber: number;
  code: string;
  name: string;
  category: string;
  priceBs: number;
  costBs: number;
  stock: number;
  errors: string[];
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value;
  const raw = String(value ?? '').trim().replace(/\s/g, '');
  if (!raw) return Number.NaN;
  const normalized = raw.includes(',') && raw.includes('.')
    ? raw.lastIndexOf(',') > raw.lastIndexOf('.')
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/,/g, '')
    : raw.replace(',', '.');
  return Number(normalized);
}

export function parseInventoryRows(values: unknown[][]): InventoryImportRow[] {
  if (values.length === 0) throw new Error('IMPORT_REQUIRES_HEADER');
  const headerAliases: Record<string, keyof Omit<InventoryImportRow, 'rowNumber' | 'errors'>> = {
    code: 'code',
    codigo: 'code',
    sku: 'code',
    name: 'name',
    nombre: 'name',
    product: 'name',
    producto: 'name',
    category: 'category',
    categoria: 'category',
    price_bs: 'priceBs',
    precio_bs: 'priceBs',
    precio: 'priceBs',
    cost_bs: 'costBs',
    costo_bs: 'costBs',
    costo: 'costBs',
    stock: 'stock',
    cantidad: 'stock',
    existencia: 'stock',
  };
  const indexes = new Map<string, number>();
  values[0].forEach((cell, index) => {
    const field = headerAliases[normalizeHeader(cell)];
    if (field) indexes.set(field, index);
  });
  const required: Array<keyof Omit<InventoryImportRow, 'rowNumber' | 'errors'>> = [
    'code', 'name', 'category', 'priceBs', 'costBs', 'stock',
  ];
  const missing = required.filter((field) => !indexes.has(field));
  if (missing.length) throw new Error(`IMPORT_MISSING_COLUMNS:${missing.join(',')}`);

  const rows = values.slice(1)
    .map((cells, index): InventoryImportRow => {
      const cell = (field: keyof Omit<InventoryImportRow, 'rowNumber' | 'errors'>) => cells[indexes.get(field)!];
      const row: InventoryImportRow = {
        rowNumber: index + 2,
        code: String(cell('code') ?? '').trim(),
        name: String(cell('name') ?? '').trim(),
        category: String(cell('category') ?? '').trim(),
        priceBs: numberValue(cell('priceBs')),
        costBs: numberValue(cell('costBs')),
        stock: numberValue(cell('stock')),
        errors: [],
      };
      if (!row.code) row.errors.push('Falta código/SKU.');
      if (!row.name) row.errors.push('Falta nombre.');
      if (!row.category) row.errors.push('Falta categoría.');
      if (!Number.isFinite(row.priceBs) || row.priceBs < 0) row.errors.push('Precio Bs inválido.');
      if (!Number.isFinite(row.costBs) || row.costBs < 0) row.errors.push('Costo Bs inválido.');
      if (!Number.isFinite(row.stock) || row.stock < 0) row.errors.push('Stock inválido.');
      return row;
    })
    .filter((row) => row.code || row.name || row.category || Number.isFinite(row.priceBs) || Number.isFinite(row.stock));

  const codes = new Set<string>();
  for (const row of rows) {
    const key = row.code.toLocaleLowerCase();
    if (!key) continue;
    if (codes.has(key)) row.errors.push('Código duplicado en el archivo.');
    codes.add(key);
  }
  if (rows.length === 0) throw new Error('IMPORT_HAS_NO_DATA_ROWS');
  if (rows.length > 500) throw new Error('IMPORT_ROW_LIMIT_EXCEEDED');
  return rows;
}

export function parseInventoryWorkbook(data: ArrayBuffer): InventoryImportRow[] {
  const workbook = XLSX.read(data, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('IMPORT_WORKBOOK_HAS_NO_SHEETS');
  const values = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  });
  return parseInventoryRows(values);
}
