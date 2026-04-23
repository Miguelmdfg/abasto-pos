import { Button, Separator } from '@heroui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { canAccessPath, getRoleLabel, useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { IconBoxes, IconCosts, IconDebt, IconGrid, IconHistory, IconReceipt, IconSettings } from './icons';

type NavItem = {
  key: string;
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

export function AppSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const { user } = useAuth();

  const items: NavItem[] = [
    { key: 'dashboard',      to: '/',               labelKey: 'nav.dashboard',     icon: <IconGrid /> },
    { key: 'billing',        to: '/pos',             labelKey: 'nav.billing',       icon: <IconReceipt /> },
    { key: 'sales-history',  to: '/sales-history',   labelKey: 'nav.salesHistory',  icon: <IconHistory /> },
    { key: 'cash-closures',  to: '/cash-closures',   labelKey: 'nav.cashClosures',  icon: <IconHistory /> },
    { key: 'inventory',      to: '/inventory',       labelKey: 'nav.inventory',     icon: <IconBoxes /> },
    { key: 'debts',          to: '/debts',           labelKey: 'nav.debts',         icon: <IconDebt /> },
    { key: 'costs',          to: '/costs',           labelKey: 'nav.costs',         icon: <IconCosts /> },
    { key: 'settings',       to: '/settings',        labelKey: 'nav.settings',      icon: <IconSettings /> },
  ];

  const itemsByRole = items.filter((item) => {
    if (!user) return false;
    return canAccessPath(user.role, item.to);
  });

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
          <span className="text-sm font-extrabold">AP</span>
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
          const base = 'w-full justify-start gap-3 rounded-lg px-4 py-3 text-left font-semibold transition-colors';
          const active = 'bg-primary/15 text-primary';
          const inactive = 'text-slate-500 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800';

          if (item.disabled) {
            return (
              <Button key={item.key} variant="ghost" className={`${base} ${inactive} opacity-60`} isDisabled>
                <span className="flex items-center gap-3">{item.icon}<span>{t(item.labelKey)}</span></span>
              </Button>
            );
          }

          return (
            <NavLink key={item.key} to={item.to} className="block">
              <Button variant="ghost" className={`${base} ${isActive ? active : inactive}`}>
                <span className="flex items-center gap-3">{item.icon}<span>{t(item.labelKey)}</span></span>
              </Button>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4">
        <Separator className="my-2" />
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <div className="flex size-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">AM</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.name ?? t('user.name')}</p>
            <p className="truncate text-xs text-slate-500">{user ? getRoleLabel(user.role) : t('user.role')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
