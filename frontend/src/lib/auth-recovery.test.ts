import { describe, expect, it } from 'vitest';
import { extractRecoverySessionFromHash, extractRecoverySessionFromUrl } from './auth-recovery';

describe('auth recovery helpers', () => {
  it('extracts Supabase tokens from a hash link', () => {
    const url = 'http://localhost:5173/reset-password#access_token=abc&refresh_token=def&type=recovery';
    expect(extractRecoverySessionFromUrl(url)).toEqual({
      access_token: 'abc',
      refresh_token: 'def',
      type: 'recovery',
    });
  });

  it('extracts Supabase tokens from a query-string link', () => {
    const url = 'http://localhost:5173/reset-password?code=xyz&type=recovery';
    expect(extractRecoverySessionFromUrl(url)).toEqual({
      access_token: undefined,
      refresh_token: undefined,
      code: 'xyz',
      type: 'recovery',
    });
  });

  it('ignores non-recovery URLs', () => {
    const url = 'http://localhost:5173/login?foo=bar';
    expect(extractRecoverySessionFromUrl(url)).toBeNull();
  });

  it('reads tokens from an HTML anchor hash', () => {
    expect(extractRecoverySessionFromHash('#access_token=token1&refresh_token=token2&type=recovery')).toEqual({
      access_token: 'token1',
      refresh_token: 'token2',
      type: 'recovery',
    });
  });
});
