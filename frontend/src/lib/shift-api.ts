import { isSupabaseConfigured, supabase } from './supabase';

export async function openRemoteShift(input: {
  code: string;
  initialAmountBs: number;
  initialAmountUsd: number;
}) {
  if (!isSupabaseConfigured || !supabase) throw new Error('SUPABASE_NOT_CONFIGURED');

  const { data, error } = await supabase.rpc('open_cashier_shift', {
    p_code: input.code,
    p_initial_amount_bs: input.initialAmountBs,
    p_initial_amount_usd: input.initialAmountUsd,
  });

  if (error) throw error;
  return data as { id: string; code: string; status: 'open'; initial_amount_bs: number; initial_amount_usd: number };
}

export async function closeRemoteShift(input: {
  countedAmountBs: number;
  countedAmountUsd: number;
  exchangeRateBcv: number;
}) {
  if (!isSupabaseConfigured || !supabase) throw new Error('SUPABASE_NOT_CONFIGURED');

  const { data, error } = await supabase.rpc('close_cashier_shift', {
    p_counted_amount_bs: input.countedAmountBs,
    p_counted_amount_usd: input.countedAmountUsd,
    p_exchange_rate_bcv: input.exchangeRateBcv,
  });

  if (error) throw error;
  return data as { id: string; code: string; status: 'closed'; difference_bs: number };
}
