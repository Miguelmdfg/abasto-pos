import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

function ModuleLoadingFallback() {
  return (
    <div className="space-y-5 p-4 md:p-6" role="status" aria-label="Cargando módulo">
      <span className="sr-only">Cargando módulo...</span>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-800/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70" />
    </div>
  );
}

export function AppLayout() {
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileNavOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMobileNavOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
      <AppSidebar
        isMobileOpen={isMobileNavOpen}
        onNavigate={() => setIsMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          isMenuOpen={isMobileNavOpen}
          onMenuClick={() => setIsMobileNavOpen((open) => !open)}
        />
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto">
          <Suspense fallback={<ModuleLoadingFallback />}>
            <div key={location.pathname} className="module-transition min-h-full">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
