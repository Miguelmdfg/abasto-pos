import { Button, Card } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <Card.Header className="flex flex-col gap-1 px-6 pb-0 pt-6">
          <Card.Title className="text-2xl font-semibold">{t('notFound.title')}</Card.Title>
          <Card.Description className="text-small text-default-500">
            {t('notFound.description')}
          </Card.Description>
        </Card.Header>
        <Card.Content className="px-6 pb-6 pt-4">
          <Button variant="primary" onPress={() => navigate('/', { replace: true })}>
            {t('notFound.goHome')}
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}

