/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';
import { loadRemoteAppSettings, saveRemoteAppSettings } from './app-settings-api';
import { isSupabaseConfigured } from './supabase';
import { useAuth } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethodKey = 'efectivo_bs' | 'efectivo_usd' | 'pagomovil' | 'punto_venta' | 'mixto' | 'fiado';

export type AppSettings = {
  // Tasa e IVA
  iva: number;                        // porcentaje, ej. 16
  // Datos del negocio
  negocio_nombre: string;
  negocio_rif: string;
  negocio_direccion: string;
  negocio_telefono: string;
  // Pago móvil
  pagomovil_banco: string;
  pagomovil_numero: string;
  pagomovil_cedula: string;
  // Métodos de pago habilitados
  metodos_habilitados: Record<PaymentMethodKey, boolean>;
  // Alertas
  stock_minimo_global: number;        // unidades
  dias_alerta_morosidad: number;      // días
  limite_deuda_global: number;        // Bs
};

const SETTINGS_KEY = 'abasto.settings';

const DEFAULT_SETTINGS: AppSettings = {
  iva: 16,
  negocio_nombre: 'Abasto POS',
  negocio_rif: '',
  negocio_direccion: '',
  negocio_telefono: '',
  pagomovil_banco: '',
  pagomovil_numero: '',
  pagomovil_cedula: '',
  metodos_habilitados: {
    efectivo_bs:  true,
    efectivo_usd: true,
    pagomovil:    true,
    punto_venta:  true,
    mixto:        true,
    fiado:        true,
  },
  stock_minimo_global: 5,
  dias_alerta_morosidad: 30,
  limite_deuda_global: 5000,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSettings(): AppSettings {
  try {
    const raw = readLocalStorage(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      metodos_habilitados: {
        ...DEFAULT_SETTINGS.metodos_habilitados,
        ...(parsed.metodos_habilitados ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings): void {
  writeLocalStorage(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Context ──────────────────────────────────────────────────────────────────

type SettingsContextValue = {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refreshSettings: () => Promise<boolean>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => isSupabaseConfigured ? DEFAULT_SETTINGS : loadSettings());
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(null);
      setIsLoading(false);
      return true;
    }

    setIsLoading(true);
    try {
      const remoteSettings = await loadRemoteAppSettings();
      setSettings(remoteSettings);
      setError(null);
      return true;
    } catch {
      setError('No se pudo cargar la configuración compartida. Verifica la conexión y que las migraciones de configuración estén aplicadas.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user || !isSupabaseConfigured) void refreshSettings();
  }, [isAuthLoading, refreshSettings, user]);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    isLoading,
    isSaving,
    error,
    refreshSettings,
    async updateSettings(partial) {
      if (isLoading) throw new Error('SETTINGS_NOT_LOADED');
      const next: AppSettings = {
        ...settings,
        ...partial,
        metodos_habilitados: {
          ...settings.metodos_habilitados,
          ...(partial.metodos_habilitados ?? {}),
        },
      };

      setIsSaving(true);
      try {
        if (isSupabaseConfigured) await saveRemoteAppSettings(next);
        else saveSettings(next);
        setSettings(next);
        setError(null);
      } catch {
        setError('No se pudo guardar la configuración. Los cambios no fueron aplicados.');
        throw new Error('SETTINGS_SAVE_FAILED');
      } finally {
        setIsSaving(false);
      }
    },
    async resetSettings() {
      if (isLoading) throw new Error('SETTINGS_NOT_LOADED');
      setIsSaving(true);
      try {
        if (isSupabaseConfigured) await saveRemoteAppSettings(DEFAULT_SETTINGS);
        else saveSettings(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
        setError(null);
      } catch {
        setError('No se pudo restablecer la configuración. Los cambios no fueron aplicados.');
        throw new Error('SETTINGS_SAVE_FAILED');
      } finally {
        setIsSaving(false);
      }
    },
  }), [error, isLoading, isSaving, refreshSettings, settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
