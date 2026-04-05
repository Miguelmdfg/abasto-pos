/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RateEntry = {
  fecha: string;  // ISO string
  rate: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'abasto.rateHistory';
const MAX_ENTRIES = 365;

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
  pushRate: (rate: number) => void;
  clearHistory: () => void;
};

const RateHistoryContext = createContext<RateHistoryContextValue | null>(null);

export function RateHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<RateEntry[]>(loadHistory);

  const value = useMemo<RateHistoryContextValue>(() => ({
    history,
    pushRate(rate) {
      const entry: RateEntry = { fecha: new Date().toISOString(), rate };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(next);
        return next;
      });
    },
    clearHistory() {
      saveHistory([]);
      setHistory([]);
    },
  }), [history]);

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
