import { describe, expect, it } from 'vitest';
import * as XLSX from '@e965/xlsx';
import { parseInventoryRows, parseInventoryWorkbook } from './inventory-import';

describe('parseInventoryRows', () => {
  it('maps Spanish headers and decimal comma values', () => {
    expect(parseInventoryRows([
      ['Código', 'Nombre', 'Categoría', 'Precio Bs', 'Costo Bs', 'Existencia'],
      ['A-1', 'Arroz', 'Granos', '1.234,50', '900,25', 12],
    ])).toEqual([{
      rowNumber: 2,
      code: 'A-1',
      name: 'Arroz',
      category: 'Granos',
      priceBs: 1234.5,
      costBs: 900.25,
      stock: 12,
      errors: [],
    }]);
  });

  it('marks invalid and duplicate SKU rows without hiding them', () => {
    const rows = parseInventoryRows([
      ['sku', 'producto', 'categoria', 'precio_bs', 'costo_bs', 'stock'],
      ['A-1', 'Arroz', 'Granos', 10, 8, 2],
      ['a-1', '', 'Granos', -1, 'abc', -1],
    ]);
    expect(rows[1].errors).toEqual(expect.arrayContaining([
      'Código duplicado en el archivo.',
      'Falta nombre.',
      'Precio Bs inválido.',
      'Costo Bs inválido.',
      'Stock inválido.',
    ]));
  });

  it('requires all import columns and at least one data row', () => {
    expect(() => parseInventoryRows([['nombre'], ['arroz']])).toThrow('IMPORT_MISSING_COLUMNS');
    expect(() => parseInventoryRows([['sku', 'producto', 'categoria', 'precio_bs', 'costo_bs', 'stock']]))
      .toThrow('IMPORT_HAS_NO_DATA_ROWS');
  });

  it('parses the first worksheet from an actual XLSX workbook buffer', () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['SKU', 'Producto', 'Categoria', 'Precio Bs', 'Costo Bs', 'Stock'],
      ['AR-01', 'Arroz', 'Granos', 50, 42, 8],
    ]), 'Inventario');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const rows = parseInventoryWorkbook(bytes);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ code: 'AR-01', name: 'Arroz', priceBs: 50, stock: 8, errors: [] });
  });
});
