import { Button, Separator } from '@heroui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { IconBoxes, IconChart, IconGrid, IconReceipt, IconSettings } from './icons';

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

  const items: NavItem[] = [
    { key: 'dashboard', to: '/', labelKey: 'nav.dashboard', icon: <IconGrid /> },
    { key: 'billing', to: '#', labelKey: 'nav.billing', icon: <IconReceipt />, disabled: true },
    { key: 'inventory', to: '#', labelKey: 'nav.inventory', icon: <IconBoxes />, disabled: true },
    { key: 'reports', to: '#', labelKey: 'nav.reports', icon: <IconChart />, disabled: true },
    { key: 'settings', to: '#', labelKey: 'nav.settings', icon: <IconSettings />, disabled: true },
  ];

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
        {items.map((item) => {
          const isActive = item.to !== '#' && location.pathname === item.to;
          const base =
            'w-full justify-start gap-3 rounded-lg px-4 py-3 text-left font-semibold transition-colors';
          const active = 'bg-primary/10 text-primary';
          const inactive =
            'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800';

          if (item.disabled) {
            return (
              <Button
                key={item.key}
                variant="ghost"
                className={`${base} ${inactive} opacity-60`}
                isDisabled
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </span>
              </Button>
            );
          }

          return (
            <NavLink key={item.key} to={item.to} className="block">
              <Button variant="ghost" className={`${base} ${isActive ? active : inactive}`}>
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </span>
              </Button>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4">
        <Separator className="my-2" />
        <div className="flex items-center gap-3 p-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            AM
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{t('user.name')}</p>
            <p className="truncate text-xs text-slate-500">{t('user.role')}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
