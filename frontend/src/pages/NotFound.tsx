import { Button, Card } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfccb,_#f8fafc_35%,_#eef2ff)] p-6 dark:bg-[radial-gradient(circle_at_top,_#0f172a,_#111827_40%,_#020817)]">
      <Card className="w-full max-w-xl overflow-hidden border border-emerald-200 bg-white/90 shadow-[0_35px_80px_rgba(16,185,129,0.18)] dark:border-slate-700 dark:bg-slate-900/85">
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
          <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/90">
            Abasto POS
          </div>
          <h1 className="text-3xl font-black tracking-tight">{t('notFound.title')}</h1>
        </div>

        <Card.Header className="flex flex-col gap-2 px-6 pb-0 pt-6">
          <div className="flex justify-center text-6xl">🛠️</div>
          <Card.Description className="text-center text-base text-slate-600 dark:text-slate-300">
            {t('notFound.description')}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4 px-6 pb-6 pt-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Ups, algo falló. Pero tranquilo, lo estamos revisando y lo resolveremos pronto.
          </div>
          <Button variant="primary" className="w-full" onPress={() => navigate('/', { replace: true })}>
            {t('notFound.goHome')}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}

