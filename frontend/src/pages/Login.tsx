import { Button, Card, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type AuthUser, useAuth } from '../lib/auth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const localUsers: Array<AuthUser & { password: string }> = [
    { id: 1, name: 'Dueño', email: 'dueno@abasto.local', password: '123456', role: 'dueno' },
    { id: 2, name: 'Cajero', email: 'cajero@abasto.local', password: '123456', role: 'cajero' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresa email y contraseña');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const local = localUsers.find(
          (candidate) =>
            candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password,
        );
        if (!local) {
          setError(data.error ?? 'Error al iniciar sesión');
          return;
        }
        login({ id: local.id, name: local.name, email: local.email, role: local.role });
        navigate('/pos', { replace: true });
        return;
      }
      if (data.ok && data.user) {
        login(data.user as AuthUser);
        navigate('/pos', { replace: true });
        return;
      }
      setError('Error al iniciar sesión');
    } catch {
      const local = localUsers.find(
        (candidate) =>
          candidate.email.toLowerCase() === email.trim().toLowerCase() && candidate.password === password,
      );
      if (!local) {
        setError('No se pudo conectar con el servidor');
        return;
      }
      login({ id: local.id, name: local.name, email: local.email, role: local.role });
      navigate('/pos', { replace: true });
    } finally {
      setIsLoading(false);
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
            <Button type="submit" variant="primary" isDisabled={isLoading} fullWidth>
              {isLoading ? 'Entrando…' : 'Entrar'}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Demo: `dueno@abasto.local` / `123456` o `cajero@abasto.local` / `123456`
            </p>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
