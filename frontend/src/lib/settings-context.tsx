/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

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
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    updateSettings(partial) {
      setSettings((prev) => {
        const next: AppSettings = {
          ...prev,
          ...partial,
          metodos_habilitados: {
            ...prev.metodos_habilitados,
            ...(partial.metodos_habilitados ?? {}),
          },
        };
        saveSettings(next);
        return next;
      });
    },
    resetSettings() {
      saveSettings(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
    },
  }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
