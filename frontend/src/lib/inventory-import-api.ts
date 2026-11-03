import { supabase } from './supabase';
import type { InventoryImportRow } from './inventory-import';

export async function importCatalogInventory(rows: InventoryImportRow[]): Promise<number> {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await supabase.rpc('import_inventory_products', {
    p_rows: rows.map((row) => ({
      code: row.code,
      name: row.name,
      category: row.category,
      price_bs: row.priceBs,
      cost_bs: row.costBs,
      stock: row.stock,
    })),
  });
  if (error) throw error;
  return Number(data);
}
