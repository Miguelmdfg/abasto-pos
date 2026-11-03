import { supabase } from './supabase';

export type ManagedProfile = {
  id: string;
  name: string;
  email: string;
  role: 'dueno' | 'cajero';
  active: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  tax_id: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
};

function requireClient() {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
}

export async function listManagedProfiles(): Promise<ManagedProfile[]> {
  const { data, error } = await requireClient()
    .from('profiles')
    .select('id, name, email, role, active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as ManagedProfile[];
}

export async function inviteManagedUser(input: { email: string; name: string; role: ManagedProfile['role'] }) {
  const { data, error } = await requireClient().functions.invoke('invite-user', { body: input });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data as Pick<ManagedProfile, 'id' | 'email' | 'name' | 'role'>;
}

export async function updateManagedProfile(profile: ManagedProfile): Promise<void> {
  const { error } = await requireClient().rpc('update_managed_profile', {
    p_profile_id: profile.id,
    p_name: profile.name,
    p_role: profile.role,
    p_active: profile.active,
  });
  if (error) throw error;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await requireClient().from('suppliers')
    .select('id, name, tax_id, contact_name, phone, email, address, notes, active')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Supplier[];
}

export async function saveSupplier(input: Omit<Supplier, 'id' | 'active'> & { id?: string }): Promise<void> {
  const { error } = await requireClient().from('suppliers').upsert({
    ...input,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function setSupplierActive(id: string, active: boolean): Promise<void> {
  const { error } = await requireClient().from('suppliers')
    .update({ active, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
