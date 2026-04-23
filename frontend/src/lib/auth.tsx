import { createContext, useContext, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';

export type UserRole = 'dueno' | 'cajero';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
};

const AUTH_KEY = 'abasto.auth.user';

const ROLE_ALLOWED_ROUTES: Record<UserRole, string[]> = {
  dueno: ['/', '/pos', '/sales-history', '/cash-closures', '/inventory', '/debts', '/costs', '/settings'],
  cajero: ['/pos', '/inventory', '/debts'],
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(value: unknown): UserRole | null {
  if (value === 'cajero') return 'cajero';
  if (value === 'dueno' || value === 'dueño' || value === 'owner' || value === 'admin') return 'dueno';
  return null;
}

function getInitialUser(): AuthUser | null {
  const raw = readLocalStorage(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    const role = normalizeRole(parsed.role);
    if (!role || !parsed.name || !parsed.email || typeof parsed.id !== 'number') return null;
    return { id: parsed.id, name: parsed.name, email: parsed.email, role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getInitialUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login(nextUser) {
        const normalizedUser: AuthUser = {
          ...nextUser,
          role: normalizeRole(nextUser.role) ?? 'cajero',
        };
        setUser(normalizedUser);
        writeLocalStorage(AUTH_KEY, JSON.stringify(normalizedUser));
      },
      logout() {
        setUser(null);
        writeLocalStorage(AUTH_KEY, '');
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function canAccessPath(role: UserRole, path: string): boolean {
  const allowed = ROLE_ALLOWED_ROUTES[role] ?? [];
  return allowed.includes(path);
}

export function getRoleLabel(role: UserRole): string {
  return role === 'dueno' ? 'Dueño' : 'Cajero';
}

