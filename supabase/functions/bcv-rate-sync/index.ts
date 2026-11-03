import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseOfficialBcvRate } from '../_shared/bcv-rate.ts';

const encoder = new TextEncoder();

function constantTimeEquals(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.length !== rightBytes.length) return false;

  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const expectedSecret = Deno.env.get('BCV_SYNC_SECRET');
  const providedSecret = request.headers.get('x-bcv-sync-secret') ?? '';
  if (!expectedSecret || !constantTimeEquals(providedSecret, expectedSecret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const response = await fetch('https://www.bcv.org.ve/', {
      headers: { 'user-agent': 'AbastoPOS-OfficialRate/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`BCV_HTTP_${response.status}`);

    const officialRate = parseOfficialBcvRate(await response.text());
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_SERVICE_CONFIGURATION_MISSING');

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.rpc('record_official_bcv_rate', {
      p_value: officialRate.value,
      p_published_at: officialRate.publishedAt,
    });
    if (error) throw new Error(`RATE_PERSIST_FAILED: ${error.message}`);

    return Response.json({
      ok: true,
      rate: officialRate.value,
      publishedAt: officialRate.publishedAt,
      result: data,
    });
  } catch (error) {
    console.error('Official BCV rate synchronization failed:', error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN_SYNC_ERROR' },
      { status: 502 },
    );
  }
});
