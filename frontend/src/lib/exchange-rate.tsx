/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';
import { isSupabaseConfigured, supabase } from './supabase';

const RATE_KEY = 'abasto.exchangeRate.value';
const UPDATED_AT_KEY = 'abasto.exchangeRate.updatedAt';
const DEFAULT_RATE = 36;
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

type ExchangeRateContextValue = {
  rate: number;
  updatedAt: number;
  isStale: boolean;
  isLoading: boolean;
  error: string | null;
  refreshRate: () => Promise<boolean>;
  setRate: (nextRate: number) => void;
};

const ExchangeRateContext = createContext<ExchangeRateContextValue | null>(null);

function getInitialRate(): number {
  if (isSupabaseConfigured) return 0;
  const stored = Number(readLocalStorage(RATE_KEY));
  if (Number.isFinite(stored) && stored > 0) return stored;
  return DEFAULT_RATE;
}

function getInitialUpdatedAt(): number {
  if (isSupabaseConfigured) return 0;
  const stored = Number(readLocalStorage(UPDATED_AT_KEY));
  if (Number.isFinite(stored) && stored > 0) return stored;
  return 0;
}

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  const [rate, setRateState] = useState<number>(getInitialRate);
  const [updatedAt, setUpdatedAt] = useState<number>(getInitialUpdatedAt);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const refreshRate = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      setError(null);
      return true;
    }

    setIsLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('exchange_rates')
        .select('value, created_at')
        .eq('rate_type', 'bcv')
        .eq('source', 'bcv')
        .is('valid_to', null)
        .maybeSingle();

      if (queryError || !data) {
        setError(queryError
          ? 'No se pudo consultar la tasa oficial del BCV.'
          : 'No hay una tasa oficial del BCV registrada todavía.');
        return false;
      }

      const remoteRate = Number(data.value);
      const remoteUpdatedAt = new Date(data.created_at).getTime();
      if (!Number.isFinite(remoteRate) || remoteRate <= 0 || !Number.isFinite(remoteUpdatedAt)) {
        setError('La tasa oficial guardada no tiene un formato válido.');
        return false;
      }

      setRateState(remoteRate);
      setUpdatedAt(remoteUpdatedAt);
      setError(null);
      return true;
    } catch {
      setError('No se pudo consultar la tasa oficial del BCV por un error de conexión.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void refreshRate();
    const intervalId = window.setInterval(() => { void refreshRate(); }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [refreshRate]);

  const value = useMemo<ExchangeRateContextValue>(() => ({
    rate,
    updatedAt,
    isStale: !isSupabaseConfigured || !updatedAt || Date.now() - updatedAt > STALE_AFTER_MS,
    isLoading,
    error,
    refreshRate,
    setRate(nextRate) {
      if (isSupabaseConfigured) throw new Error('OFFICIAL_BCV_RATE_IS_READ_ONLY');
      if (!Number.isFinite(nextRate) || nextRate <= 0) return;
      writeLocalStorage(RATE_KEY, String(nextRate));
      const now = Date.now();
      writeLocalStorage(UPDATED_AT_KEY, String(now));
      setRateState(nextRate);
      setUpdatedAt(now);
    },
  }), [error, isLoading, rate, refreshRate, updatedAt]);

  return <ExchangeRateContext.Provider value={value}>{children}</ExchangeRateContext.Provider>;
}

export function useExchangeRate(): ExchangeRateContextValue {
  const ctx = useContext(ExchangeRateContext);
  if (!ctx) throw new Error('useExchangeRate must be used within ExchangeRateProvider');
  return ctx;
}
