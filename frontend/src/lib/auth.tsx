import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './storage';
import { isSupabaseConfigured, supabase } from './supabase';

export type UserRole = 'dueno' | 'cajero';

const DEMO_AUTH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEMO_AUTH === 'true';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarPath?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  loginDemo: (user: AuthUser) => void;
  updateAvatarPath: (path: string) => Promise<string | null>;
  logout: () => void;
};

const AUTH_KEY = 'abasto.auth.user';

const ROLE_ALLOWED_ROUTES: Record<UserRole, string[]> = {
  dueno: ['/', '/pos', '/sales-history', '/reports', '/cash-closures', '/inventory', '/inventory-import', '/suppliers', '/users', '/debts', '/costs', '/settings'],
  cajero: ['/pos', '/inventory', '/debts'],
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(value: unknown): UserRole | null {
  if (value === 'cajero') return 'cajero';
  if (value === 'dueno' || value === 'dueño' || value === 'owner' || value === 'admin') return 'dueno';
  return null;
}

async function loadProfile(client: NonNullable<typeof supabase>, id: string) {
  const profileResult = await client
    .from('profiles')
    .select('id, name, email, role, active, avatar_path')
    .eq('id', id)
    .maybeSingle();

  if (
    profileResult.error
    && profileResult.error.message.includes('avatar_path')
    && (profileResult.error.code === '42703' || profileResult.error.code === 'PGRST204')
  ) {
    return client
      .from('profiles')
      .select('id, name, email, role, active')
      .eq('id', id)
      .maybeSingle();
  }

  return profileResult;
}

function getAvatarPath(profile: object): string | null {
  if ('avatar_path' in profile && typeof profile.avatar_path === 'string') {
    return profile.avatar_path;
  }
  return null;
}

function getInitialUser(): AuthUser | null {
  if (!import.meta.env.DEV || import.meta.env.VITE_DEMO_AUTH !== 'true') return null;
  const raw = readLocalStorage(AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    const role = normalizeRole(parsed.role);
    if (!role || !parsed.name || !parsed.email || typeof parsed.id !== 'string') return null;
    return { id: parsed.id, name: parsed.name, email: parsed.email, role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getInitialUser());
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setIsLoading(false);
      return;
    }
    const authClient = client;

    let mounted = true;

    async function restoreSession() {
      const { data, error } = await authClient.auth.getSession();
      if (error || !data.session) {
        if (mounted) setIsLoading(false);
        return;
      }

      const { data: profile } = await loadProfile(authClient, data.session.user.id);

      if (mounted && profile?.active) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: normalizeRole(profile.role) ?? 'cajero',
          avatarPath: getAvatarPath(profile),
        });
      }
      if (mounted) setIsLoading(false);
    }

    void restoreSession();
    const { data: listener } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      async login(email, password) {
        if (!isSupabaseConfigured && !DEMO_AUTH_ENABLED) {
          return 'La autenticación con Supabase no está configurada. Copia frontend/.env.example a .env.local y completa las credenciales.';
        }

        if (!supabase) {
          return 'La autenticación no está disponible en este entorno.';
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) return error?.message ?? 'No se pudo iniciar sesión.';

        const { data: profile, error: profileError } = await loadProfile(supabase, data.user.id);

        if (profileError || !profile) return 'El usuario no tiene un perfil configurado.';
        if (!profile.active) return 'Tu cuenta está desactivada. Contacta al administrador.';
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: normalizeRole(profile.role) ?? 'cajero',
          avatarPath: getAvatarPath(profile),
        });
        return null;
      },
      loginDemo(nextUser) {
        if (!import.meta.env.DEV || import.meta.env.VITE_DEMO_AUTH !== 'true') return;
        setUser(nextUser);
        writeLocalStorage(AUTH_KEY, JSON.stringify(nextUser));
      },
      async updateAvatarPath(path) {
        if (!user || !supabase) return 'La actualización de la foto requiere una sesión de Supabase.';
        const { error } = await supabase.rpc('set_my_avatar_path', { p_avatar_path: path });
        if (error) return 'No se pudo guardar la foto del perfil.';
        setUser((current) => current ? { ...current, avatarPath: path } : current);
        return null;
      },
      async logout() {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        writeLocalStorage(AUTH_KEY, '');
      },
    }),
    [isLoading, user],
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
