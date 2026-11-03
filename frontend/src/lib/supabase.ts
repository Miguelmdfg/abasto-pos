import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const hasPlaceholderValue =
  /your-project|your-anon-key|example\.supabase\.co/i.test(rawUrl) ||
  /your-anon-key|replace-me/i.test(rawAnonKey);

export const isSupabaseConfigured = Boolean(rawUrl && rawAnonKey && !hasPlaceholderValue);

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawAnonKey)
  : null;
