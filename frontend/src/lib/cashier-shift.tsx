/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';
import { isSupabaseConfigured, supabase } from './supabase';
import { useAuth } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CashierShift = {
  id: string;              // CIERRE-YYYYMMDD-XXXX
  fecha: string;           // ISO string
  cajero: string;
  subtotalProductos: number;
  cantidadProductos: number;
  creditosOtorgados: number;
  totalVenta: number;
  efectivoDivisas: number;
  efectivoDivisasBs: number;
  efectivoBolivares: number;
  puntoVenta: number;
  pagoMovil: number;
  creditosPagados: number;
  totalCaja: number;
  diferencia: number;
  estadoCuadre: 'cuadrado' | 'sobrante' | 'faltante';
  cierresParciales: Array<{
    nombre: string;
    efectivoDivisas: number;
    efectivoBolivares: number;
    puntoVenta: number;
    pagoMovil: number;
    creditosPagados: number;
    totalCaja: number;
  }>;
  divisasRestante: number;
  bolivaresRestante: number;
  totalDejadoCaja: number;
  distribucion: Array<{
    responsable: string;
    monto: number;
  }>;
  tasaCierre: number;      // Tasa del día al momento del cierre
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'abasto.cashierShifts';
const MAX_RECORDS = 500;

function generateShiftId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CIERRE-${date}-${rand}`;
}

function loadShifts(): CashierShift[] {
  try {
    const raw = readLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CashierShift[]) : [];
  } catch {
    return [];
  }
}

function saveShifts(shifts: CashierShift[]): void {
  writeLocalStorage(STORAGE_KEY, JSON.stringify(shifts));
}

// ─── Context ──────────────────────────────────────────────────────────────────

type CashierShiftContextValue = {
  shifts: CashierShift[];
  shiftsError: string | null;
  currentShift: { id: string; code: string; opened_at: string; initial_amount_bs: number; initial_amount_usd: number } | null;
  isLoadingCurrentShift: boolean;
  refreshCurrentShift: () => Promise<void>;
  refreshShifts: () => Promise<void>;
  addShift: (draft: Omit<CashierShift, 'id' | 'fecha'>) => CashierShift;
  clearShifts: () => void;
};

const CashierShiftContext = createContext<CashierShiftContextValue | null>(null);

export function CashierShiftProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [shifts, setShifts] = useState<CashierShift[]>(() => isSupabaseConfigured ? [] : loadShifts());
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [currentShift, setCurrentShift] = useState<CashierShiftContextValue['currentShift']>(null);
  const [isLoadingCurrentShift, setIsLoadingCurrentShift] = useState(isSupabaseConfigured);

  const refreshShifts = useCallback(async () => {
    setShiftsError(null);
    if (!supabase) return;

    const { data, error } = await supabase
      .from('cashier_shifts')
      .select('id, code, cashier_id, closed_at, counted_amount_bs, counted_amount_usd, expected_amount_bs, expected_amount_usd, difference_bs, exchange_rate_bcv_at_close')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false });

    if (error) {
      setShiftsError('No se pudo actualizar el historial de cierres. Comprueba la conexión e inténtalo de nuevo.');
      return;
    }

    const remoteShifts: CashierShift[] = (data ?? []).map((shift) => {
      const rate = Number(shift.exchange_rate_bcv_at_close) || 1;
      const expectedBs = Number(shift.expected_amount_bs) || 0;
      const expectedUsd = Number(shift.expected_amount_usd) || 0;
      const countedBs = Number(shift.counted_amount_bs) || 0;
      const countedUsd = Number(shift.counted_amount_usd) || 0;
      const difference = Number(shift.difference_bs) || 0;

      return {
        id: shift.code ?? shift.id,
        fecha: shift.closed_at ?? new Date().toISOString(),
        cajero: shift.cashier_id,
        subtotalProductos: expectedBs,
        cantidadProductos: 0,
        creditosOtorgados: 0,
        totalVenta: expectedBs + (expectedUsd * rate),
        efectivoDivisas: countedUsd,
        efectivoDivisasBs: countedUsd * rate,
        efectivoBolivares: countedBs,
        puntoVenta: 0,
        pagoMovil: 0,
        creditosPagados: 0,
        totalCaja: countedBs + (countedUsd * rate),
        diferencia: difference,
        estadoCuadre: difference === 0 ? 'cuadrado' : difference > 0 ? 'sobrante' : 'faltante',
        cierresParciales: [],
        divisasRestante: 0,
        bolivaresRestante: 0,
        totalDejadoCaja: 0,
        distribucion: [],
        tasaCierre: rate,
      };
    });

    setShifts(remoteShifts);
  }, []);

  const refreshCurrentShift = useCallback(async () => {
    if (!supabase) {
      setIsLoadingCurrentShift(false);
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setCurrentShift(null);
      setIsLoadingCurrentShift(false);
      return;
    }
    const { data } = await supabase
      .from('cashier_shifts')
      .select('id, code, opened_at, initial_amount_bs, initial_amount_usd')
      .eq('cashier_id', authData.user.id)
      .eq('status', 'open')
      .maybeSingle();
    setCurrentShift(data ? {
      id: data.id,
      code: data.code,
      opened_at: data.opened_at,
      initial_amount_bs: Number(data.initial_amount_bs),
      initial_amount_usd: Number(data.initial_amount_usd),
    } : null);
    setIsLoadingCurrentShift(false);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user || !isSupabaseConfigured) void refreshCurrentShift();
  }, [isAuthLoading, refreshCurrentShift, user]);

  const value = useMemo<CashierShiftContextValue>(() => ({
    shifts,
    shiftsError,
    currentShift,
    isLoadingCurrentShift,
    refreshCurrentShift,
    refreshShifts,
    addShift(draft) {
      if (isSupabaseConfigured) throw new Error('REMOTE_SHIFT_REQUIRED');
      const record: CashierShift = {
        ...draft,
        id: generateShiftId(),
        fecha: new Date().toISOString(),
      };
      setShifts((prev) => {
        const next = [record, ...prev].slice(0, MAX_RECORDS);
        saveShifts(next);
        return next;
      });
      return record;
    },
    clearShifts() {
      if (isSupabaseConfigured) throw new Error('REMOTE_SHIFT_HISTORY_IS_READ_ONLY');
      saveShifts([]);
      setShifts([]);
    },
  }), [currentShift, isLoadingCurrentShift, refreshCurrentShift, refreshShifts, shifts, shiftsError]);

  return (
    <CashierShiftContext.Provider value={value}>
      {children}
    </CashierShiftContext.Provider>
  );
}

export function useCashierShift(): CashierShiftContextValue {
  const ctx = useContext(CashierShiftContext);
  if (!ctx) throw new Error('useCashierShift must be used within CashierShiftProvider');
  return ctx;
}
