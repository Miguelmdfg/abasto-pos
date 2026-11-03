/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';
import { isSupabaseConfigured, supabase } from './supabase';
import { useAuth } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SaleProduct = {
  id: string | number;
  name: string;
  qty: number;
  price: number;
};

export type SaleRecord = {
  id: string;              // VTA-YYYYMMDD-XXXX
  fecha: string;           // ISO string
  cajero: string;
  metodo: string;          // 'efectivo_bs' | 'efectivo_usd' | 'pagomovil' | 'punto_venta' | 'mixto' | 'fiado'
  total: number;           // total en Bs
  tasa?: number;           // tasa Bs/USD usada al facturar
  productos: SaleProduct[];
  referencia?: string;     // últimos 6 dígitos pago móvil
  banco?: string;
  monto_efectivo?: number;
  moneda_efectivo?: 'bs' | 'usd';
  payments?: Array<{
    method: string;
    amountBs: number;
    amount: number;
    currency: 'BS' | 'USD';
    reference?: string;
    bank?: string;
  }>;
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
  refreshError: string | null;
  refreshSales: () => Promise<boolean>;
  addSale: (draft: Omit<SaleRecord, 'id' | 'fecha'>) => SaleRecord;
  clearSales: () => void;
};

const SalesHistoryContext = createContext<SalesHistoryContextValue | null>(null);

export function SalesHistoryProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [sales, setSales] = useState<SaleRecord[]>(() => isSupabaseConfigured ? [] : loadSales());
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refreshSales = useCallback(async (): Promise<boolean> => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setRefreshError(null);
      return true;
    }
    const salesClient = client;

    const { data, error } = await salesClient
      .from('sales')
      .select('id, code, created_at, cashier_id, total_bs, exchange_rate_bcv, sale_items(product_id, name_snapshot, quantity, unit_price_bs), sale_payments(method, amount, currency, amount_bs, reference, bank)')
      .order('created_at', { ascending: false })
      .limit(MAX_RECORDS);

    if (error || !data) {
      setRefreshError('No se pudo actualizar el historial de ventas. Comprueba la conexión e inténtalo de nuevo.');
      return false;
    }

    const remoteSales: SaleRecord[] = data.map((sale) => {
      const items = Array.isArray(sale.sale_items) ? sale.sale_items : [];
      const payments = Array.isArray(sale.sale_payments) ? sale.sale_payments : [];
      const mappedPayments = payments.map((payment) => ({
        method: String(payment.method ?? '').toLowerCase(),
        amountBs: Number(payment.amount_bs),
        amount: Number(payment.amount),
        currency: payment.currency as 'BS' | 'USD',
        reference: payment.reference ?? undefined,
        bank: payment.bank ?? undefined,
      }));
      const firstPayment = mappedPayments[0];
      const normalizedMethod = (method: string) => ({
        efectivo_bs: 'efectivo_bs',
        efectivo_usd: 'efectivo_usd',
        pago_movil: 'pagomovil',
        punto_venta: 'punto_venta',
        nota_credito: 'fiado',
      }[method] ?? method);
      return {
        id: sale.code,
        fecha: sale.created_at,
        cajero: sale.cashier_id,
        metodo: mappedPayments.length > 1 ? 'mixto' : normalizedMethod(firstPayment?.method ?? 'desconocido'),
        total: Number(sale.total_bs),
        tasa: Number(sale.exchange_rate_bcv),
        productos: items.map((item) => ({
          id: item.product_id,
          name: item.name_snapshot,
          qty: Number(item.quantity),
          price: Number(item.unit_price_bs),
        })),
        referencia: firstPayment?.reference,
        banco: firstPayment?.bank,
        payments: mappedPayments,
      };
    });
    setSales(remoteSales);
    setRefreshError(null);
    return true;
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user || !isSupabaseConfigured) void refreshSales();
  }, [isAuthLoading, refreshSales, user]);

  const value = useMemo<SalesHistoryContextValue>(() => ({
    sales,
    refreshError,
    refreshSales,
    addSale(draft) {
      if (isSupabaseConfigured) throw new Error('REMOTE_SALE_REQUIRED');
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
      if (isSupabaseConfigured) throw new Error('REMOTE_SALES_HISTORY_IS_READ_ONLY');
      saveSales([]);
      setSales([]);
    },
  }), [refreshError, refreshSales, sales]);

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
