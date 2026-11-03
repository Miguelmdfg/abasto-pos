import { Button, Card, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type AuthUser, useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const DEMO_AUTH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DEMO_AUTH === 'true';

export function Login() {
  const navigate = useNavigate();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const localUsers: Array<AuthUser & { password: string }> = [
    { id: 'demo-owner', name: 'Dueño', email: 'dueno@abasto.local', password: '123456', role: 'dueno' },
    { id: 'demo-cashier', name: 'Cajero', email: 'cajero@abasto.local', password: '123456', role: 'cajero' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Ingresa email y contraseña');
      return;
    }
    setIsLoading(true);
    try {
      const authError = await login(email.trim(), password);
      if (!authError) {
        navigate('/pos', { replace: true });
        return;
      }

      if (DEMO_AUTH_ENABLED) {
        const local = localUsers.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password,
        );
        if (local) {
          loginDemo({ id: local.id, name: local.name, email: local.email, role: local.role });
          navigate('/pos', { replace: true });
          return;
        }
      }

      setError(authError);
    } catch {
      if (DEMO_AUTH_ENABLED) {
        const local = localUsers.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password,
        );
        if (local) {
          loginDemo({ id: local.id, name: local.name, email: local.email, role: local.role });
          navigate('/pos', { replace: true });
          return;
        }
      }
      setError('No se pudo iniciar sesión. Verifica la configuración de autenticación.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    const trimmedEmail = email.trim();
    setError('');
    setInfo('');

    if (!trimmedEmail) {
      setError('Escribe tu email para recuperar la contraseña.');
      return;
    }

    if (!supabase) {
      setError('La autenticación real no está disponible en este entorno.');
      return;
    }

    setIsSendingReset(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: new URL('/reset-password', window.location.origin).toString(),
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setInfo('Revisa tu correo. Te enviamos un enlace para restablecer la contraseña.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'No se pudo enviar el enlace de recuperación.');
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <Card className="w-full max-w-md border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <Card.Header className="flex flex-col gap-1 px-6 pb-0 pt-6">
          <Card.Title className="text-2xl font-semibold">Iniciar sesión</Card.Title>
          <Card.Description className="text-small text-default-500">
            Ingresa tu email y contraseña para acceder
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-4 px-6 pb-6 pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              value={email}
              onChange={setEmail}
              isRequired
              isDisabled={isLoading}
            >
              <Label>Email</Label>
              <Input type="email" placeholder="tu@email.com" autoComplete="email" />
            </TextField>

            <TextField
              value={password}
              onChange={setPassword}
              isRequired
              isDisabled={isLoading}
            >
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </TextField>
            {error && (
              <p className="text-small text-danger" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="text-small text-success-600" role="status">
                {info}
              </p>
            )}
            <Button type="submit" variant="primary" isDisabled={isLoading} fullWidth>
              {isLoading ? 'Entrando…' : 'Entrar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              isDisabled={isSendingReset || isLoading}
              fullWidth
              onPress={handleForgotPassword}
            >
              {isSendingReset ? 'Enviando…' : '¿Olvidaste tu contraseña?'}
            </Button>
            {DEMO_AUTH_ENABLED && (
              <p className="text-center text-xs text-slate-500">
                Demo local: dueno@abasto.local / 123456 o cajero@abasto.local / 123456
              </p>
            )}

            {!DEMO_AUTH_ENABLED && (
              <p className="text-center text-xs text-slate-500">
                Autenticación real activa. Usa tus credenciales de Supabase.
              </p>
            )}
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
