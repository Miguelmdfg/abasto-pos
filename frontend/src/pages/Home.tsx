import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">{t('hello.title')}</h1>
      <Button variant="primary" onPress={() => navigate('/login')}>
        {t('hello.cta')}
      </Button>
    </div>
  );
}
