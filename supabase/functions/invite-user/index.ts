import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const authorization = request.headers.get('authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', authData.user.id)
    .eq('role', 'dueno')
    .eq('active', true)
    .maybeSingle();
  if (profileError || !profile) return new Response('Owner access required', { status: 403, headers: corsHeaders });

  let payload: { email?: unknown; name?: unknown; role?: unknown };
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400);
  }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const role = payload.role === 'dueno' ? 'dueno' : payload.role === 'cajero' ? 'cajero' : null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || name.length > 120 || !role) {
    return jsonResponse({ error: 'INVALID_INVITATION_FIELDS' }, 400);
  }

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name },
  });
  if (error || !data.user) {
    console.error('User invitation failed:', error);
    return jsonResponse({ error: 'USER_INVITATION_FAILED' }, 400);
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ name, role, updated_at: new Date().toISOString() })
    .eq('id', data.user.id);
  if (updateError) {
    console.error('Invited user profile setup failed:', updateError);
    return jsonResponse({ error: 'INVITED_PROFILE_SETUP_FAILED', userId: data.user.id }, 502);
  }

  return jsonResponse({ id: data.user.id, email: data.user.email, name, role });
});
