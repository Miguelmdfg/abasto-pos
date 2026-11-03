import { isSupabaseConfigured, supabase } from './supabase';

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  costo: number;
  stock: number;
};

export const canUseDemoCatalog = false;

export async function loadCatalogProducts(): Promise<CatalogProduct[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('CATALOG_NOT_CONFIGURED');
  }

  const [{ data: products, error: productsError }, { data: prices, error: pricesError }, { data: costs, error: costsError }, { data: stocks, error: stocksError }] = await Promise.all([
    supabase.from('products').select('id, name, category_id, categories(name)').eq('active', true),
    supabase.from('product_price_history').select('product_id, price_bs').is('valid_to', null),
    supabase.from('product_cost_history').select('product_id, cost_bs').is('valid_to', null),
    supabase.from('product_stock').select('product_id, current_quantity'),
  ]);

  if (productsError || pricesError || costsError || stocksError) {
    throw new Error('CATALOG_LOAD_FAILED');
  }

  const pricesByProduct = new Map((prices ?? []).map((row) => [row.product_id, Number(row.price_bs)]));
  const costsByProduct = new Map((costs ?? []).map((row) => [row.product_id, Number(row.cost_bs)]));
  const stockByProduct = new Map((stocks ?? []).map((row) => [row.product_id, Number(row.current_quantity)]));

  return (products ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    category: typeof product.categories === 'object' && product.categories !== null && 'name' in product.categories
      ? String(product.categories.name ?? 'Sin categoría')
      : 'Sin categoría',
    price: pricesByProduct.get(product.id) ?? 0,
    costo: costsByProduct.get(product.id) ?? 0,
    stock: stockByProduct.get(product.id) ?? 0,
  }));
}

export async function upsertCatalogProduct(input: {
  id?: string;
  name: string;
  category: string;
  price: number;
  costo: number;
  stock: number;
}): Promise<void> {
  if (!supabase) throw new Error('CATALOG_NOT_CONFIGURED');

  const { error } = await supabase.rpc('upsert_product', {
    p_id: input.id ?? null,
    p_code: input.id ? null : `SKU-${Date.now()}`,
    p_name: input.name,
    p_category: input.category,
    p_price_bs: input.price,
    p_cost_bs: input.costo,
    p_initial_stock: input.id ? 0 : input.stock,
  });

  if (error) throw error;
}

export async function adjustCatalogStock(productId: string, quantity: number, reason: string): Promise<void> {
  if (!supabase) throw new Error('CATALOG_NOT_CONFIGURED');

  const { error } = await supabase.rpc('adjust_product_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_reason: reason,
    p_movement_type: quantity >= 0 ? 'ajuste_positivo' : 'ajuste_negativo',
  });

  if (error) throw error;
}
