/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';
import {
  createRemoteCreditCustomer,
  createRemoteCreditPayment,
  listRemoteCreditAccounts,
} from './credit-api';
import type { CreditAccountRow } from './credit-api';
import { isSupabaseConfigured } from './supabase';
import { useAuth } from './auth';

export type Abono = {
  id: string | number;
  fecha: string;
  monto: number;
  tasa?: number;
  nota?: string;
  method?: string;
  currency?: string;
};

export type CreditNote = {
  id: string;
  code: string;
  issuedAt: string;
  chargedBs: number;
  balanceBs: number;
};

export type CreditPaymentDetails = {
  method: 'EFECTIVO_BS' | 'PAGO_MOVIL' | 'PUNTO_VENTA' | 'TRANSFERENCIA';
  amount: number;
  currency: 'BS';
  amountBs: number;
  exchangeRate?: number;
  reference?: string;
  bank?: string;
};

export type DebtItem = {
  id: string | number;
  nombre: string;
  telefono?: string;
  cedula?: string;
  limite_credito: number;
  deuda_total: number;
  ultima_compra?: string;
  abonos: Abono[];
  ventas: string[];
  creditNotes?: CreditNote[];
};

const STORAGE_KEY = 'abasto.debts';

function loadDebts(): DebtItem[] {
  try {
    const raw = readLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as DebtItem[]).map((debt) => ({ ...debt, ventas: debt.ventas ?? [] }))
      : [];
  } catch {
    return [];
  }
}

function saveDebts(debts: DebtItem[]): void {
  writeLocalStorage(STORAGE_KEY, JSON.stringify(debts));
}

function mapCreditAccounts(rows: CreditAccountRow[]): DebtItem[] {
  const customers = new Map<string, DebtItem>();
  for (const row of rows) {
    const item = customers.get(row.customer_id) ?? {
      id: row.customer_id,
      nombre: row.customer_name,
      telefono: row.phone ?? undefined,
      cedula: row.document ?? undefined,
      limite_credito: Number(row.credit_limit_bs),
      deuda_total: 0,
      abonos: [],
      ventas: [],
      creditNotes: [],
    };
    if (row.note_id && row.note_code && row.issued_at) {
      item.creditNotes?.push({
        id: row.note_id,
        code: row.note_code,
        issuedAt: row.issued_at,
        chargedBs: Number(row.charged_bs) || 0,
        balanceBs: Number(row.balance_bs) || 0,
      });
      item.deuda_total += Number(row.balance_bs) || 0;
      for (const sale of row.sales ?? []) {
        item.ventas.push(sale.id);
        if (!item.ultima_compra || sale.fecha > item.ultima_compra) item.ultima_compra = sale.fecha;
      }
      for (const payment of row.payments ?? []) {
        item.abonos.push({
          id: payment.id,
          fecha: payment.fecha,
          monto: Number(payment.monto),
          nota: payment.nota ?? undefined,
          method: payment.method,
          currency: payment.currency,
        });
      }
    }
    customers.set(row.customer_id, item);
  }
  return [...customers.values()];
}

type DebtsContextValue = {
  debts: DebtItem[];
  isLoading: boolean;
  error: string | null;
  refreshDebts: () => Promise<boolean>;
  addClient: (data: Omit<DebtItem, 'id' | 'abonos' | 'ventas' | 'deuda_total' | 'ultima_compra' | 'creditNotes'>) => Promise<DebtItem>;
  addDebt: (clientId: string | number, amount: number, saleId?: string, note?: string) => void;
  addAbono: (clientId: string | number, amountBs: number, noteId?: string, note?: string, rate?: number, payment?: CreditPaymentDetails) => Promise<void>;
  setDebts: React.Dispatch<React.SetStateAction<DebtItem[]>>;
};

const DebtsContext = createContext<DebtsContextValue | null>(null);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [debts, setDebtsState] = useState<DebtItem[]>(() => isSupabaseConfigured ? [] : loadDebts());
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const refreshDebts = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(null);
      return true;
    }
    setIsLoading(true);
    try {
      const rows = await listRemoteCreditAccounts();
      setDebtsState(mapCreditAccounts(rows));
      setError(null);
      return true;
    } catch {
      setError('No se pudo cargar la cartera de notas de crédito. Comprueba la conexión e inténtalo de nuevo.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user || !isSupabaseConfigured) void refreshDebts();
  }, [isAuthLoading, refreshDebts, user]);

  const value = useMemo<DebtsContextValue>(() => ({
    debts,
    isLoading,
    error,
    refreshDebts,
    setDebts: (updater) => {
      setDebtsState((previous) => {
        const next = typeof updater === 'function' ? updater(previous) : updater;
        if (!isSupabaseConfigured) saveDebts(next);
        return next;
      });
    },
    async addClient(data) {
      if (isSupabaseConfigured) {
        const customer = await createRemoteCreditCustomer({
          name: data.nombre,
          document: data.cedula,
          phone: data.telefono,
          creditLimitBs: data.limite_credito,
        });
        const item: DebtItem = {
          id: customer.id,
          nombre: customer.name,
          telefono: customer.phone ?? undefined,
          cedula: customer.document ?? undefined,
          limite_credito: Number(customer.credit_limit_bs),
          deuda_total: 0,
          abonos: [],
          ventas: [],
          creditNotes: [],
        };
        await refreshDebts();
        return item;
      }
      const client: DebtItem = {
        ...data,
        id: Date.now(),
        deuda_total: 0,
        abonos: [],
        ventas: [],
      };
      const next = [...debts, client];
      saveDebts(next);
      setDebtsState(next);
      return client;
    },
    addDebt(clientId, amount, saleId, note) {
      if (isSupabaseConfigured) throw new Error('REMOTE_CREDIT_SALE_REQUIRED');
      setDebtsState((previous) => {
        const next = previous.map((debt) => debt.id !== clientId ? debt : {
          ...debt,
          deuda_total: debt.deuda_total + amount,
          ultima_compra: new Date().toISOString(),
          ventas: saleId ? [...debt.ventas, saleId] : debt.ventas,
          abonos: note
            ? [...debt.abonos, { id: Date.now(), fecha: new Date().toISOString(), monto: 0, nota: note }]
            : debt.abonos,
        });
        saveDebts(next);
        return next;
      });
    },
    async addAbono(clientId, amountBs, noteId, note, rate, payment) {
      if (isSupabaseConfigured) {
        if (typeof clientId !== 'string' || !noteId) throw new Error('CREDIT_NOTE_REQUIRED');
        await createRemoteCreditPayment({
          noteId,
          payment: payment?.method ?? 'EFECTIVO_BS',
          amount: payment?.amount ?? amountBs,
          currency: payment?.currency ?? 'BS',
          amountBs: payment?.amountBs ?? amountBs,
          exchangeRate: payment?.exchangeRate,
          reference: payment?.reference,
          bank: payment?.bank,
          notes: note,
        });
        await refreshDebts();
        return;
      }
      const next = debts.map((debt) => debt.id !== clientId ? debt : {
        ...debt,
        deuda_total: Math.max(0, debt.deuda_total - amountBs),
        abonos: [...debt.abonos, { id: Date.now(), fecha: new Date().toISOString(), monto: amountBs, nota: note, tasa: rate }],
      });
      saveDebts(next);
      setDebtsState(next);
    },
  }), [debts, error, isLoading, refreshDebts]);

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
}

export function useDebts(): DebtsContextValue {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error('useDebts must be used within DebtsProvider');
  return ctx;
}
