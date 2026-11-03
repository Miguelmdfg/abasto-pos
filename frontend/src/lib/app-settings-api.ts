import { isSupabaseConfigured, supabase } from './supabase';
import type { AppSettings } from './settings-context';

type RemoteAppSettings = {
  business_name: string;
  rif: string;
  address: string;
  phone: string;
  iva_default: number;
  stock_minimum_global: number;
  overdue_days: number;
  credit_limit_default_bs: number;
  payment_mobile_bank: string;
  payment_mobile_phone: string;
  payment_mobile_document: string;
  enabled_payment_methods: AppSettings['metodos_habilitados'];
};

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
}

function mapSettings(row: RemoteAppSettings): AppSettings {
  return {
    iva: Number(row.iva_default),
    negocio_nombre: row.business_name,
    negocio_rif: row.rif,
    negocio_direccion: row.address,
    negocio_telefono: row.phone,
    pagomovil_banco: row.payment_mobile_bank,
    pagomovil_numero: row.payment_mobile_phone,
    pagomovil_cedula: row.payment_mobile_document,
    metodos_habilitados: row.enabled_payment_methods,
    stock_minimo_global: Number(row.stock_minimum_global),
    dias_alerta_morosidad: Number(row.overdue_days),
    limite_deuda_global: Number(row.credit_limit_default_bs),
  };
}

export async function loadRemoteAppSettings(): Promise<AppSettings> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('app_settings')
    .select('business_name, rif, address, phone, iva_default, stock_minimum_global, overdue_days, credit_limit_default_bs, payment_mobile_bank, payment_mobile_phone, payment_mobile_document, enabled_payment_methods')
    .eq('id', 1)
    .single();

  if (error) throw error;
  return mapSettings(data as RemoteAppSettings);
}

export async function saveRemoteAppSettings(settings: AppSettings): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('app_settings')
    .update({
      business_name: settings.negocio_nombre,
      rif: settings.negocio_rif,
      address: settings.negocio_direccion,
      phone: settings.negocio_telefono,
      iva_default: settings.iva,
      stock_minimum_global: settings.stock_minimo_global,
      overdue_days: settings.dias_alerta_morosidad,
      credit_limit_default_bs: settings.limite_deuda_global,
      payment_mobile_bank: settings.pagomovil_banco,
      payment_mobile_phone: settings.pagomovil_numero,
      payment_mobile_document: settings.pagomovil_cedula,
      enabled_payment_methods: settings.metodos_habilitados,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select('id')
    .single();

  if (error) throw error;
}
