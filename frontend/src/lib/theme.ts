import { readLocalStorage, writeLocalStorage } from './storage';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'abasto.theme';

export function getInitialTheme(): ThemeMode {
  const stored = readLocalStorage(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function setTheme(mode: ThemeMode): void {
  writeLocalStorage(THEME_KEY, mode);
  applyTheme(mode);
}
