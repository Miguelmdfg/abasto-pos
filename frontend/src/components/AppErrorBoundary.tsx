import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fef3c7,_#fff_45%,_#f8fafc)] p-6 dark:bg-[radial-gradient(circle_at_top,_#1f2937,_#0f172a_40%,_#020817)]">
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-amber-200/80 bg-white/90 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-6 text-white">
              <div className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/90">
                Abasto POS
              </div>
              <h1 className="text-3xl font-black tracking-tight">Ups, algo falló</h1>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center justify-center text-6xl">⚠️</div>
              <p className="text-center text-lg text-slate-700 dark:text-slate-200">
                Pero tranquilo, estamos revisando el problema y lo resolveremos pronto.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Intenta recargar la página o volver al inicio en unos instantes.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Recargar página
                </button>
                <button
                  type="button"
                  onClick={() => window.location.assign('/pos')}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Ir al POS
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
