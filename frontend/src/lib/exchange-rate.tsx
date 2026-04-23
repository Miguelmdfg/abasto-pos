/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

const RATE_KEY = 'abasto.exchangeRate.value';
const UPDATED_AT_KEY = 'abasto.exchangeRate.updatedAt';
const DEFAULT_RATE = 36;

type ExchangeRateContextValue = {
  rate: number;
  updatedAt: number;
  isStale: boolean;
  setRate: (nextRate: number) => void;
};

const ExchangeRateContext = createContext<ExchangeRateContextValue | null>(null);

function getInitialRate(): number {
  const stored = Number(readLocalStorage(RATE_KEY));
  if (Number.isFinite(stored) && stored > 0) return stored;
  return DEFAULT_RATE;
}

function getInitialUpdatedAt(): number {
  const stored = Number(readLocalStorage(UPDATED_AT_KEY));
  if (Number.isFinite(stored) && stored > 0) return stored;
  return Date.now();
}

function isOlderThan24h(updatedAt: number): boolean {
  const hours24 = 24 * 60 * 60 * 1000;
  return Date.now() - updatedAt > hours24;
}

export function ExchangeRateProvider({ children }: { children: React.ReactNode }) {
  const [rate, setRateState] = useState<number>(getInitialRate);
  const [updatedAt, setUpdatedAt] = useState<number>(getInitialUpdatedAt);

  const value = useMemo<ExchangeRateContextValue>(() => {
    return {
      rate,
      updatedAt,
      isStale: isOlderThan24h(updatedAt),
      setRate(nextRate) {
        if (!Number.isFinite(nextRate) || nextRate <= 0) return;
        writeLocalStorage(RATE_KEY, String(nextRate));
        const now = Date.now();
        writeLocalStorage(UPDATED_AT_KEY, String(now));
        setRateState(nextRate);
        setUpdatedAt(now);
      },
    };
  }, [rate, updatedAt]);

  return <ExchangeRateContext.Provider value={value}>{children}</ExchangeRateContext.Provider>;
}

export function useExchangeRate(): ExchangeRateContextValue {
  const ctx = useContext(ExchangeRateContext);
  if (!ctx) throw new Error('useExchangeRate must be used within ExchangeRateProvider');
  return ctx;
}

