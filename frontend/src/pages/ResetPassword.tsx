import { Button, Card, Input, Label, TextField } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractRecoverySessionFromUrl } from '../lib/auth-recovery';
import { supabase } from '../lib/supabase';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const session = extractRecoverySessionFromUrl(window.location.href);
    if (!session) {
      setError('El enlace de recuperación no es válido o ya expiró. Solicita otro correo.');
      return;
    }

    setIsReady(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!supabase) {
      setError('La configuración de Supabase no está disponible.');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setInfo('Tu contraseña se actualizó correctamente.');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <Card className="w-full max-w-md border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <Card.Header className="flex flex-col gap-1 px-6 pb-0 pt-6">
          <Card.Title className="text-2xl font-semibold">Restablecer contraseña</Card.Title>
          <Card.Description className="text-small text-default-500">
            Ingresa tu nueva contraseña para continuar.
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-4 px-6 pb-6 pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField value={password} onChange={setPassword} isRequired isDisabled={!isReady || isLoading}>
              <Label>Nueva contraseña</Label>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" />
            </TextField>

            <TextField value={confirmPassword} onChange={setConfirmPassword} isRequired isDisabled={!isReady || isLoading}>
              <Label>Confirmar contraseña</Label>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" />
            </TextField>

            {error && <p className="text-small text-danger" role="alert">{error}</p>}
            {info && <p className="text-small text-success-600" role="status">{info}</p>}

            <Button type="submit" variant="primary" isDisabled={!isReady || isLoading} fullWidth>
              {isLoading ? 'Guardando…' : 'Guardar nueva contraseña'}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
