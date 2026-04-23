/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Abono = {
  id: number;
  fecha: string;
  monto: number;
  tasa?: number;
  nota?: string;
};

export type DebtItem = {
  id: number;
  nombre: string;
  telefono?: string;
  cedula?: string;
  limite_credito: number;
  deuda_total: number;
  ultima_compra?: string;
  abonos: Abono[];
  ventas: string[]; // IDs de SaleRecord asociados (ej: VTA-20260328-1234)
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'abasto.debts';

function loadDebts(): DebtItem[] {
  try {
    const raw = readLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migración: asegurar que todos tengan el campo ventas
    return Array.isArray(parsed)
      ? (parsed as DebtItem[]).map((d) => ({ ...d, ventas: d.ventas ?? [] }))
      : [];
  } catch {
    return [];
  }
}

function saveDebts(debts: DebtItem[]): void {
  writeLocalStorage(STORAGE_KEY, JSON.stringify(debts));
}

// ─── Context ──────────────────────────────────────────────────────────────────

type DebtsContextValue = {
  debts: DebtItem[];
  addClient: (data: Omit<DebtItem, 'id' | 'abonos' | 'ventas' | 'deuda_total' | 'ultima_compra'>) => DebtItem;
  addDebt: (clientId: number, monto: number, saleId?: string, nota?: string) => void;
  addAbono: (clientId: number, monto: number, nota?: string, tasa?: number) => void;
  setDebts: React.Dispatch<React.SetStateAction<DebtItem[]>>;
};

const DebtsContext = createContext<DebtsContextValue | null>(null);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  const [debts, setDebtsState] = useState<DebtItem[]>(loadDebts);

  function persist(next: DebtItem[]) {
    saveDebts(next);
    setDebtsState(next);
  }

  const value = useMemo<DebtsContextValue>(() => ({
    debts,
    setDebts: (updater) => {
      setDebtsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        saveDebts(next);
        return next;
      });
    },
    addClient(data) {
      const client: DebtItem = {
        ...data,
        id: Date.now(),
        deuda_total: 0,
        abonos: [],
        ventas: [],
      };
      persist([...debts, client]);
      return client;
    },
    addDebt(clientId, monto, saleId, nota) {
      persist(
        debts.map((d) =>
          d.id !== clientId
            ? d
            : {
                ...d,
                deuda_total: d.deuda_total + monto,
                ultima_compra: new Date().toISOString(),
                ventas: saleId ? [...d.ventas, saleId] : d.ventas,
                abonos: nota
                  ? [...d.abonos, { id: Date.now(), fecha: new Date().toISOString(), monto: 0, nota }]
                  : d.abonos,
              }
        )
      );
    },
    addAbono(clientId, monto, nota, tasa) {
      persist(
        debts.map((d) =>
          d.id !== clientId
            ? d
            : {
                ...d,
                deuda_total: Math.max(0, d.deuda_total - monto),
                abonos: [
                  ...d.abonos,
                  { id: Date.now(), fecha: new Date().toISOString(), monto, nota, tasa },
                ],
              }
        )
      );
    },
  }), [debts]);

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
}

export function useDebts(): DebtsContextValue {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error('useDebts must be used within DebtsProvider');
  return ctx;
}
