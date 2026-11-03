import { isSupabaseConfigured, supabase } from './supabase';

export type SalePaymentInput = {
  method: 'EFECTIVO_BS' | 'EFECTIVO_USD' | 'PAGO_MOVIL' | 'PUNTO_VENTA' | 'TRANSFERENCIA' | 'NOTA_CREDITO';
  amount: number;
  currency: 'BS' | 'USD';
  amount_bs: number;
  exchange_rate_snapshot?: number;
  reference?: string;
  bank?: string;
};

export async function createRemoteSale(input: {
  code: string;
  items: Array<{ product_id: string; quantity: number }>;
  payments: SalePaymentInput[];
  exchangeRateBcv: number;
}) {
  if (!isSupabaseConfigured || !supabase) throw new Error('SUPABASE_NOT_CONFIGURED');

  const { data, error } = await supabase.rpc('create_sale', {
    p_code: input.code,
    p_items: input.items,
    p_payments: input.payments,
    p_exchange_rate_bcv: input.exchangeRateBcv,
    p_exchange_rate_paralelo: null,
    p_customer_id: null,
    p_credit_note_id: null,
  });

  if (error) throw error;
  return data as { id: string; code: string; total_bs: number };
}
