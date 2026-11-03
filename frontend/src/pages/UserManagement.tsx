import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import {
  inviteManagedUser,
  listManagedProfiles,
  updateManagedProfile,
  type ManagedProfile,
} from '../lib/management-api';

export function UserManagement({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ManagedProfile[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<ManagedProfile['role']>('cajero');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setProfiles(await listManagedProfiles());
      setError('');
    } catch {
      setError('No se pudo cargar usuarios. Comprueba que la migración de administración esté desplegada y que seas dueño activo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function inviteUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      const invited = await inviteManagedUser({ email: email.trim(), name: name.trim(), role });
      setEmail('');
      setName('');
      setNotice(`Invitación enviada a ${invited.email}. El usuario debe completar el proceso por correo.`);
      await refresh();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'No se pudo enviar la invitación.');
    } finally {
      setIsSaving(false);
    }
  }

  async function saveProfile(profile: ManagedProfile) {
    setError('');
    setNotice('');
    setIsSaving(true);
    try {
      await updateManagedProfile(profile);
      setNotice(`Cambios guardados para ${profile.email}.`);
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el perfil.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={`space-y-5 ${embedded ? '' : 'p-4 md:p-6'}`}>
      {!embedded && <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Usuarios y permisos</h2>
        <p className="text-sm text-slate-500">Invita usuarios por correo y administra sus roles y acceso.</p>
      </div>}
      {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30">{notice}</div>}

      <form onSubmit={(event) => void inviteUser(event)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
        <h3 className="font-bold md:col-span-4">Invitar usuario</h3>
        <label className="text-xs font-semibold text-slate-500">
          Nombre
          <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Correo
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Rol inicial
          <select value={role} onChange={(event) => setRole(event.target.value as ManagedProfile['role'])} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="cajero">Cajero</option>
            <option value="dueno">Dueño</option>
          </select>
        </label>
        <button disabled={isSaving} className="self-end rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{isSaving ? 'Procesando...' : 'Enviar invitación'}</button>
        <p className="text-xs text-slate-500 md:col-span-4">La contraseña se establece mediante el enlace de invitación de Supabase; no se captura ni se almacena aquí.</p>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-bold">Cuentas ({profiles.length})</h3>
        </div>
        {isLoading ? <p className="p-4 text-sm text-slate-500">Cargando...</p> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {profiles.map((profile) => (
              <ProfileRow
                key={profile.id}
                profile={profile}
                isSelf={profile.id === user?.id}
                disabled={isSaving}
                onSave={saveProfile}
              />
            ))}
            {profiles.length === 0 && <p className="p-4 text-sm text-slate-500">No hay usuarios registrados.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileRow({
  profile,
  isSelf,
  disabled,
  onSave,
}: {
  profile: ManagedProfile;
  isSelf: boolean;
  disabled: boolean;
  onSave: (profile: ManagedProfile) => Promise<void>;
}) {
  const [draft, setDraft] = useState(profile);
  useEffect(() => { setDraft(profile); }, [profile]);
  const changed = draft.name !== profile.name || draft.role !== profile.role || draft.active !== profile.active;

  return (
    <div className="grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
      <div>
        <p className="text-sm font-semibold">{profile.email}{isSelf && <span className="ml-2 text-xs text-slate-400">Tú</span>}</p>
        <p className="text-xs text-slate-500">{profile.id}</p>
      </div>
      <label className="text-xs font-semibold text-slate-500">
        Nombre
        <input value={draft.name} maxLength={120} onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
      </label>
      <div className="flex items-end gap-3">
        <label className="min-w-24 flex-1 text-xs font-semibold text-slate-500">
          Rol
          <select value={draft.role} disabled={isSelf} onChange={(event) => setDraft((previous) => ({ ...previous, role: event.target.value as ManagedProfile['role'] }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="cajero">Cajero</option>
            <option value="dueno">Dueño</option>
          </select>
        </label>
        <label className="flex items-center gap-1 pb-2 text-xs">
          <input type="checkbox" checked={draft.active} disabled={isSelf} onChange={(event) => setDraft((previous) => ({ ...previous, active: event.target.checked }))} />
          Activo
        </label>
      </div>
      <button type="button" disabled={!changed || disabled} onClick={() => void onSave(draft)} className="rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40">Guardar</button>
    </div>
  );
}
