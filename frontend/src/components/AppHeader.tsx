import { Button, Dropdown, SearchField, Switch } from '@heroui/react';
import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { getInitialTheme, setTheme, type ThemeMode } from '../lib/theme';
import { IconBell } from './icons';

export function AppHeader() {
  const { lang, setLang, t } = useI18n();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());

  const themeChecked = themeMode === 'dark';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-8">
      <div className="w-full max-w-md">
        <SearchField aria-label="Search" className="w-full">
          <SearchField.Input placeholder={t('header.search.placeholder')} />
        </SearchField>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Notifications"
          className="text-slate-500 dark:text-slate-300"
        >
          <IconBell />
        </Button>

        <Switch
          size="sm"
          isSelected={themeChecked}
          onChange={(isSelected) => {
            const next: ThemeMode = isSelected ? 'dark' : 'light';
            setTheme(next);
            setThemeMode(next);
          }}
        >
          <span className="text-xs font-semibold">{themeChecked ? 'Dark' : 'Light'}</span>
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
        <span className="hidden text-sm font-semibold md:block">{t('header.store')}</span>
      </div>
    </header>
  );
}

