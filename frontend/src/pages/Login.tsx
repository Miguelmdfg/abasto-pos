import { Button, Card, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        setError(data.error ?? 'Error al iniciar sesión');
        return;
      }
      if (data.ok && data.user) {
        navigate('/', { replace: true });
        return;
      }
      setError('Error al iniciar sesión');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
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
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
