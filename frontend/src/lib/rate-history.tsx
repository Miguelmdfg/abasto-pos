/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';
import { isSupabaseConfigured, supabase } from './supabase';
import { useAuth } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RateEntry = {
  fecha: string;  // ISO string
  rate: number;
};

export function getRateForDate(history: RateEntry[], isoDate: string, fallbackRate: number): number {
  const target = new Date(isoDate).getTime();
  if (!Number.isFinite(target)) return fallbackRate;

  const sorted = [...history]
    .filter((entry) => Number.isFinite(new Date(entry.fecha).getTime()) && entry.rate > 0)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  if (sorted.length === 0) return fallbackRate;

  let matched: RateEntry | null = null;
  for (const entry of sorted) {
    if (new Date(entry.fecha).getTime() <= target) {
      matched = entry;
    } else {
      break;
    }
  }

  return matched?.rate ?? sorted[0].rate ?? fallbackRate;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'abasto.rateHistory';
const MAX_ENTRIES = 365;
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

function loadHistory(): RateEntry[] {
  try {
    const raw = readLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RateEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: RateEntry[]): void {
  writeLocalStorage(STORAGE_KEY, JSON.stringify(history));
}

// ─── Context ──────────────────────────────────────────────────────────────────

type RateHistoryContextValue = {
  history: RateEntry[];
  isLoading: boolean;
  error: string | null;
  refreshHistory: () => Promise<boolean>;
  pushRate: (rate: number) => void;
  clearHistory: () => void;
};

const RateHistoryContext = createContext<RateHistoryContextValue | null>(null);

export function RateHistoryProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [history, setHistory] = useState<RateEntry[]>(() => isSupabaseConfigured ? [] : loadHistory());
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError(null);
      setIsLoading(false);
      return true;
    }

    setIsLoading(true);
    const { data, error: queryError } = await supabase
      .from('exchange_rates')
      .select('value, valid_from')
      .eq('rate_type', 'bcv')
      .order('valid_from', { ascending: false })
      .limit(MAX_ENTRIES);

    if (queryError) {
      setError('No se pudo cargar el historial remoto de tasas.');
      setIsLoading(false);
      return false;
    }

    setHistory((data ?? []).map((entry) => ({
      fecha: entry.valid_from,
      rate: Number(entry.value),
    })));
    setError(null);
    setIsLoading(false);
    return true;
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user && isSupabaseConfigured) return;
    void refreshHistory();
    if (!isSupabaseConfigured) return;
    const intervalId = window.setInterval(() => { void refreshHistory(); }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [isAuthLoading, refreshHistory, user]);

  const value = useMemo<RateHistoryContextValue>(() => ({
    history,
    isLoading,
    error,
    refreshHistory,
    pushRate(rate) {
      if (isSupabaseConfigured) {
        void refreshHistory();
        return;
      }
      if (!Number.isFinite(rate) || rate <= 0) return;
      const entry: RateEntry = { fecha: new Date().toISOString(), rate };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(next);
        return next;
      });
    },
    clearHistory() {
      if (isSupabaseConfigured) throw new Error('REMOTE_RATE_HISTORY_IS_READ_ONLY');
      saveHistory([]);
      setHistory([]);
    },
  }), [error, history, isLoading, refreshHistory]);

  return (
    <RateHistoryContext.Provider value={value}>
      {children}
    </RateHistoryContext.Provider>
  );
}

export function useRateHistory(): RateHistoryContextValue {
  const ctx = useContext(RateHistoryContext);
  if (!ctx) throw new Error('useRateHistory must be used within RateHistoryProvider');
  return ctx;
}
