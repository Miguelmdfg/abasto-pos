import { isSupabaseConfigured, supabase } from './supabase';
import type { SalePaymentInput } from './sales-api';

export type CreditAccountRow = {
  customer_id: string;
  customer_name: string;
  document: string | null;
  phone: string | null;
  credit_limit_bs: number | string;
  note_id: string | null;
  note_code: string | null;
  issued_at: string | null;
  charged_bs: number | string | null;
  paid_bs: number | string | null;
  balance_bs: number | string | null;
  sales: Array<{ id: string; fecha: string; total: number | string }> | null;
  payments: Array<{
    id: string;
    fecha: string;
    monto: number | string;
    nota: string | null;
    method: string;
    currency: string;
  }> | null;
};

function getClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
}

export async function listRemoteCreditAccounts() {
  const { data, error } = await getClient().rpc('list_credit_accounts');
  if (error) throw error;
  return (data ?? []) as CreditAccountRow[];
}

export async function createRemoteCreditCustomer(input: {
  name: string;
  document?: string;
  phone?: string;
  creditLimitBs: number;
}) {
  const { data, error } = await getClient().rpc('create_credit_customer', {
    p_name: input.name,
    p_document: input.document || null,
    p_phone: input.phone || null,
    p_credit_limit_bs: input.creditLimitBs,
  });
  if (error) throw error;
  return data as { id: string; name: string; document: string | null; phone: string | null; credit_limit_bs: number };
}

export async function createRemoteCreditSale(input: {
  code: string;
  creditNoteCode: string;
  customerId: string;
  items: Array<{ product_id: string; quantity: number }>;
  exchangeRateBcv: number;
}) {
  const { data, error } = await getClient().rpc('create_credit_sale', {
    p_code: input.code,
    p_credit_note_code: input.creditNoteCode,
    p_customer_id: input.customerId,
    p_items: input.items,
    p_exchange_rate_bcv: input.exchangeRateBcv,
    p_exchange_rate_paralelo: null,
  });
  if (error) throw error;
  return data as { id: string; code: string; total_bs: number };
}

export async function createRemoteCreditPayment(input: {
  noteId: string;
  payment: Exclude<SalePaymentInput['method'], 'NOTA_CREDITO'>;
  amount: number;
  currency: 'BS' | 'USD';
  amountBs: number;
  exchangeRate?: number;
  reference?: string;
  bank?: string;
  notes?: string;
}) {
  const { data, error } = await getClient().rpc('register_credit_note_payment', {
    p_credit_note_id: input.noteId,
    p_method: input.payment,
    p_amount: input.amount,
    p_currency: input.currency,
    p_amount_bs: input.amountBs,
    p_exchange_rate: input.exchangeRate ?? null,
    p_reference: input.reference ?? null,
    p_bank: input.bank ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  return data;
}
