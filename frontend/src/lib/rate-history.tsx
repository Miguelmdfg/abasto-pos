/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

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
