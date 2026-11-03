import { Button, Separator } from '@heroui/react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { canAccessPath, getRoleLabel, useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import { IconBoxes, IconCosts, IconDebt, IconGrid, IconHistory, IconReceipt, IconSettings } from './icons';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_BUCKET = 'user-avatars';

type NavItem = {
  key: string;
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

export function AppSidebar({
  isMobileOpen,
  onNavigate,
}: {
  isMobileOpen: boolean;
  onNavigate: () => void;
}) {
  const { t } = useI18n();
  const location = useLocation();
  const { user, updateAvatarPath } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const initials = user?.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

  useEffect(() => {
    let active = true;
    let refreshTimer: number | undefined;

    async function loadAvatar() {
      if (!user?.avatarPath || !supabase) {
        setAvatarUrl(null);
        return;
      }

      const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(user.avatarPath, 60 * 60);
      if (!active) return;
      if (error) {
        setAvatarUrl(null);
        setAvatarError('No se pudo cargar la foto del perfil.');
        return;
      }

      setAvatarUrl(data.signedUrl);
      setAvatarError('');
      refreshTimer = window.setTimeout(() => { void loadAvatar(); }, 50 * 60 * 1000);
    }

    void loadAvatar();
    return () => {
      active = false;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [user?.avatarPath]);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!user || !supabase) {
      setAvatarError('Inicia sesión con Supabase para guardar una foto de perfil.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Elige una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('La imagen debe pesar 2 MB o menos.');
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError('');
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const nextPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(nextPath, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (uploadError) {
        setAvatarError('No se pudo subir la imagen. Verifica que la migración de avatares esté aplicada.');
        return;
      }

      const updateError = await updateAvatarPath(nextPath);
      if (updateError) {
        const { error: cleanupError } = await supabase.storage.from(AVATAR_BUCKET).remove([nextPath]);
        setAvatarError(cleanupError
          ? `${updateError} Además, no se pudo eliminar la imagen temporal.`
          : updateError);
        return;
      }

      if (user.avatarPath) {
        const { error: removeError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([user.avatarPath]);
        if (removeError) setAvatarError('La foto se actualizó, pero no se pudo borrar el archivo anterior.');
      }
    } catch {
      setAvatarError('Ocurrió un error de conexión al actualizar la foto.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  const items: NavItem[] = [
    { key: 'dashboard',      to: '/',               labelKey: 'nav.dashboard',     icon: <IconGrid /> },
    { key: 'billing',        to: '/pos',             labelKey: 'nav.billing',       icon: <IconReceipt /> },
    { key: 'sales-history',  to: '/sales-history',   labelKey: 'nav.salesHistory',  icon: <IconHistory /> },
    { key: 'inventory',      to: '/inventory',       labelKey: 'nav.inventory',     icon: <IconBoxes /> },
    { key: 'suppliers', to: '/suppliers', labelKey: 'nav.suppliers', icon: <IconCosts /> },
    { key: 'debts',          to: '/debts',           labelKey: 'nav.debts',         icon: <IconDebt /> },
    { key: 'costs',          to: '/costs',           labelKey: 'nav.costs',         icon: <IconCosts /> },
    { key: 'settings',       to: '/settings',        labelKey: 'nav.settings',      icon: <IconSettings /> },
  ];

  const itemsByRole = items.filter((item) => {
    if (!user) return false;
    return canAccessPath(user.role, item.to);
  });

  return (
    <aside id="primary-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 md:visible md:static md:z-auto md:w-64 md:shrink-0 md:translate-x-0 md:overflow-visible md:shadow-none md:transition-none ${
      isMobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
    }`}>
      <div className="flex items-center gap-3 p-6">
        <div aria-hidden="true" className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl bg-slate-950 shadow-md shadow-teal-500/20 dark:bg-white">
          <span className="absolute -right-2 -top-2 size-7 rounded-full bg-teal-400" />
          <span className="absolute -bottom-3 -left-2 size-7 rounded-full bg-cyan-500" />
          <span className="relative size-3 rounded-full bg-white dark:bg-slate-950" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('app.brand')}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {itemsByRole.map((item) => {
          const isActive = item.to !== '#' && location.pathname === item.to;
          const base = 'w-full justify-start gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all duration-200 ease-out';
          const active = 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm shadow-primary/5';
          const inactive = 'text-slate-500 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800';

          if (item.disabled) {
            return (
              <Button key={item.key} variant="ghost" className={`${base} ${inactive} opacity-60`} isDisabled>
                <span className="flex items-center gap-3">{item.icon}<span>{t(item.labelKey)}</span></span>
              </Button>
            );
          }

          return (
            <NavLink key={item.key} to={item.to} end={item.to === '/'} onClick={onNavigate} className="group relative block">
              <Button variant="ghost" className={`${base} ${isActive ? active : inactive}`}>
                {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" />}
                <span className="flex items-center gap-3">
                  <span className="transition-transform duration-200 ease-out group-hover:scale-105">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                </span>
              </Button>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4">
        <Separator className="my-2" />
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Seleccionar foto de perfil"
            onChange={(event) => void handleAvatarChange(event)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!user || isUploadingAvatar}
            title={isUploadingAvatar ? 'Subiendo foto...' : 'Cambiar foto de perfil'}
            aria-label="Cambiar foto de perfil"
            className="group relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-600 ring-2 ring-white transition hover:ring-primary disabled:cursor-wait dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-900"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : initials}
            <span className="absolute inset-x-0 bottom-0 bg-slate-950/60 py-0.5 text-center text-[8px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {isUploadingAvatar ? '...' : 'Foto'}
            </span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.name ?? t('user.name')}</p>
            <p className="truncate text-xs text-slate-500">{user ? getRoleLabel(user.role) : t('user.role')}</p>
          </div>
        </div>
        {avatarError && <p role="alert" className="px-2 pt-1 text-[11px] text-danger">{avatarError}</p>}
        <p className="px-2 pt-1 text-[10px] text-slate-400">Haz clic en tus iniciales para agregar una foto.</p>
      </div>
    </aside>
  );
}
