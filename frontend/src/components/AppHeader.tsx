import { Button, Dropdown, SearchField, Switch } from '@heroui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useExchangeRate } from '../lib/exchange-rate';
import { getRoleLabel, useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { getInitialTheme, setTheme, type ThemeMode } from '../lib/theme';
import { IconBell } from './icons';

const notificationSeed = [
  { id: 1, title: 'Tasa actualizada', text: 'La tasa del día fue sincronizada automáticamente.', read: false },
  { id: 2, title: 'Inventario', text: 'Hay productos con stock bajo en la tienda.', read: false },
  { id: 3, title: 'Turno', text: 'La caja está lista para registrar nuevas ventas.', read: true },
];

export function AppHeader({
  isMenuOpen,
  onMenuClick,
}: {
  isMenuOpen: boolean;
  onMenuClick: () => void;
}) {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const { rate, updatedAt, isStale } = useExchangeRate();
  const { user, logout } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationSeed);
  const notificationButtonRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        notificationButtonRef.current?.contains(target)
        || notificationPanelRef.current?.contains(target)
      ) return;
      setIsNotificationsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsNotificationsOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationsOpen]);

  const themeChecked = themeMode === 'dark';
  const updatedLabel = updatedAt > 0
    ? new Date(updatedAt).toLocaleString(lang === 'es' ? 'es-VE' : 'en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'No disponible';

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          isIconOnly
          variant="ghost"
          className="shrink-0 text-slate-600 dark:text-slate-300 md:hidden"
          aria-label={isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          onPress={onMenuClick}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        <div className="w-full max-w-md">
        <SearchField aria-label="Search" className="w-full">
          <SearchField.Input placeholder={t('header.search.placeholder')} />
        </SearchField>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div ref={notificationButtonRef} className="relative">
          <Button
            isIconOnly
            variant="ghost"
            aria-label={t('header.notifications')}
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            className="text-slate-500 dark:text-slate-300"
            onPress={() => {
              setIsNotificationsOpen((open) => !open);
              setNotifications((items) => items.map((item) => ({ ...item, read: true })));
            }}
          >
            <IconBell />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}

          {isNotificationsOpen && (
            createPortal(
            <div
              ref={notificationPanelRef}
              role="dialog"
              aria-label={t('header.notifications')}
              className="fixed right-4 top-20 z-[9999] max-h-[calc(100vh-6rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t('header.notifications')}</p>
                <span className="text-xs text-slate-500">{unreadCount} {t('notification.new')}</span>
              </div>
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 ${
                      item.read
                        ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                        : 'border-primary/40 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
            )
          )}
        </div>

        <Switch
          size="sm"
          isSelected={themeChecked}
          onChange={(isSelected) => {
            const next: ThemeMode = isSelected ? 'dark' : 'light';
            setTheme(next);
            setThemeMode(next);
          }}
        >
          <span className="text-xs font-semibold">{themeChecked ? t('header.theme.dark') : t('header.theme.light')}</span>
        </Switch>

        <Dropdown>
          <Dropdown.Trigger
            className="min-w-[72px] rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {lang.toUpperCase()}
          </Dropdown.Trigger>
          <Dropdown.Popover>
            <Dropdown.Menu
              aria-label="Language"
              selectionMode="single"
              selectedKeys={[lang]}
              onSelectionChange={(keys) => {
                const first = Array.from(keys)[0];
                if (first === 'es' || first === 'en') setLang(first);
              }}
            >
              <Dropdown.Item key="es">ES</Dropdown.Item>
              <Dropdown.Item key="en">EN</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 md:block" />
        <div
          className={`hidden rounded-md px-2 py-1 text-[11px] font-semibold md:block ${
            isStale
              ? 'bg-warning/10 text-warning border border-warning/20'
              : 'bg-success/10 text-success border border-success/20'
          }`}
          title={rate > 0 ? `${t('rate.updatedAt')}: ${updatedLabel}` : 'No hay una tasa oficial BCV confirmada'}
        >
          {t('rate.label')}: {rate > 0 ? `${rate.toFixed(2)} Bs/USD` : 'No disponible'}
        </div>
        {user && (
          <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 md:block dark:bg-slate-800 dark:text-slate-300">
            {getRoleLabel(user.role)}
          </span>
        )}
        <Button
          variant="ghost"
          className="text-xs font-semibold text-slate-600 dark:text-slate-300"
          onPress={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          {t('header.logout')}
        </Button>
      </div>
    </header>
  );
}
