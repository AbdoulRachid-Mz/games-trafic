import { describe, it, expect } from 'vitest';
import { getSafeRedirectUrl, canSkipWelcome } from '@/lib/routes/safe-redirect';

describe('lib/routes/safe-redirect - Security and Navigation Rules', () => {
  it('should allow valid relative internal paths', () => {
    expect(getSafeRedirectUrl('/tournaments/123')).toBe('/tournaments/123');
    expect(getSafeRedirectUrl('/wallet/transactions')).toBe('/wallet/transactions');
    expect(getSafeRedirectUrl('/dashboard?tab=overview')).toBe('/dashboard?tab=overview');
  });

  it('should fall back to default when input is null, undefined, or empty', () => {
    expect(getSafeRedirectUrl(null)).toBe('/profile');
    expect(getSafeRedirectUrl(undefined)).toBe('/profile');
    expect(getSafeRedirectUrl('')).toBe('/profile');
    expect(getSafeRedirectUrl(null, '/custom-fallback')).toBe('/custom-fallback');
  });

  it('should reject external URLs (CWE-601 Open Redirect protection)', () => {
    expect(getSafeRedirectUrl('https://malicious.com')).toBe('/profile');
    expect(getSafeRedirectUrl('http://attacker.com/steal')).toBe('/profile');
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/profile');
    expect(getSafeRedirectUrl('data:text/html,evil')).toBe('/profile');
  });

  it('should reject protocol-relative URLs (//attacker.com)', () => {
    expect(getSafeRedirectUrl('//attacker.com')).toBe('/profile');
    expect(getSafeRedirectUrl('///attacker.com')).toBe('/profile');
    expect(getSafeRedirectUrl('\\\\attacker.com')).toBe('/profile');
  });

  it('should prevent auth loop redirection', () => {
    expect(getSafeRedirectUrl('/sign-in')).toBe('/profile');
    expect(getSafeRedirectUrl('/sign-up?redirect=/profile')).toBe('/profile');
    expect(getSafeRedirectUrl('/forgot-password')).toBe('/profile');
  });

  it('should reject URLs with CRLF injections', () => {
    expect(getSafeRedirectUrl('/valid\r\nSet-Cookie: evil=1')).toBe('/profile');
    expect(getSafeRedirectUrl('/valid\nLocation: evil')).toBe('/profile');
  });

  it('should handle skipWelcome parameters correctly', () => {
    const params1 = new URLSearchParams('skipWelcome=1');
    expect(canSkipWelcome(params1)).toBe(true);

    const params2 = new URLSearchParams('skip_welcome=true');
    expect(canSkipWelcome(params2)).toBe(true);

    const params3 = new URLSearchParams('ignore_visite=true');
    expect(canSkipWelcome(params3)).toBe(true);

    const params4 = new URLSearchParams('other=1');
    expect(canSkipWelcome(params4)).toBe(false);

    expect(canSkipWelcome(null)).toBe(false);
  });
});