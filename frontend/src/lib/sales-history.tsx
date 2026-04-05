/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SaleProduct = {
  id: number;
  name: string;
  qty: number;
  price: number;
};

export type SaleRecord = {
  id: string;              // VTA-YYYYMMDD-XXXX
  fecha: string;           // ISO string
  cajero: string;
  metodo: string;          // 'efectivo_bs' | 'efectivo_usd' | 'pagomovil' | 'tarjeta' | 'punto_venta' | 'mixto' | 'fiado'
  total: number;           // total en Bs
  productos: SaleProduct[];
  referencia?: string;     // últimos 6 dígitos pago móvil
  banco?: string;
  monto_efectivo?: number;
  moneda_efectivo?: 'bs' | 'usd';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'abasto.salesHistory';
const MAX_RECORDS = 500;

function generateSaleId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VTA-${date}-${rand}`;
}

function loadSales(): SaleRecord[] {
  try {
    const raw = readLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SaleRecord[]) : [];
  } catch {
    return [];
  }
}

function saveSales(sales: SaleRecord[]): void {
  writeLocalStorage(STORAGE_KEY, JSON.stringify(sales));
}

// ─── Context ──────────────────────────────────────────────────────────────────

type SalesHistoryContextValue = {
  sales: SaleRecord[];
  addSale: (draft: Omit<SaleRecord, 'id' | 'fecha'>) => SaleRecord;
  clearSales: () => void;
};

const SalesHistoryContext = createContext<SalesHistoryContextValue | null>(null);

export function SalesHistoryProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<SaleRecord[]>(loadSales);

  const value = useMemo<SalesHistoryContextValue>(() => ({
    sales,
    addSale(draft) {
      const record: SaleRecord = {
        ...draft,
        id: generateSaleId(),
        fecha: new Date().toISOString(),
      };
      setSales((prev) => {
        const next = [record, ...prev].slice(0, MAX_RECORDS);
        saveSales(next);
        return next;
      });
      return record;
    },
    clearSales() {
      saveSales([]);
      setSales([]);
    },
  }), [sales]);

  return (
    <SalesHistoryContext.Provider value={value}>
      {children}
    </SalesHistoryContext.Provider>
  );
}

export function useSalesHistory(): SalesHistoryContextValue {
  const ctx = useContext(SalesHistoryContext);
  if (!ctx) throw new Error('useSalesHistory must be used within SalesHistoryProvider');
  return ctx;
}
