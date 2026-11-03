export type RecoverySession = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  type?: string;
};

export function extractRecoverySessionFromHash(hash: string): RecoverySession | null {
  if (!hash || !hash.startsWith('#')) return null;

  const params = new URLSearchParams(hash.slice(1));
  const type = params.get('type');
  if (!type || type !== 'recovery') return null;

  const access_token = params.get('access_token') ?? undefined;
  const refresh_token = params.get('refresh_token') ?? undefined;
  const code = params.get('code') ?? undefined;

  return { access_token, refresh_token, code, type };
}

export function extractRecoverySessionFromUrl(url: string): RecoverySession | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hash = parsed.hash;
    if (hash) {
      const fromHash = extractRecoverySessionFromHash(hash);
      if (fromHash) return fromHash;
    }

    const params = new URLSearchParams(parsed.search);
    const type = params.get('type');
    if (!type || type !== 'recovery') return null;

    return {
      access_token: params.get('access_token') ?? undefined,
      refresh_token: params.get('refresh_token') ?? undefined,
      code: params.get('code') ?? undefined,
      type,
    };
  } catch {
    return null;
  }
}
