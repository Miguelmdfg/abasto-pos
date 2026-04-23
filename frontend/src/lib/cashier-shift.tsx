/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

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
  addShift: (draft: Omit<CashierShift, 'id' | 'fecha'>) => CashierShift;
  clearShifts: () => void;
};

const CashierShiftContext = createContext<CashierShiftContextValue | null>(null);

export function CashierShiftProvider({ children }: { children: React.ReactNode }) {
  const [shifts, setShifts] = useState<CashierShift[]>(loadShifts);

  const value = useMemo<CashierShiftContextValue>(() => ({
    shifts,
    addShift(draft) {
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
      saveShifts([]);
      setShifts([]);
    },
  }), [shifts]);

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
