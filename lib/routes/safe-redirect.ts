/**
 * Safe Navigation & Redirect Utility (Games-Trafics)
 * Prevents Open Redirect vulnerabilities (CWE-601) and normalizes post-auth paths.
 */

const ALLOWED_INTERNAL_PREFIXES = [
  '/',
  '/tournaments',
  '/wallet',
  '/dashboard',
  '/profile',
  '/chats',
  '/shops',
  '/products',
  '/game-clips',
  '/games',
  '/services',
  '/partners',
];

/**
 * Validates and normalizes a redirect target.
 * Rejects external URLs, protocol-relative URLs (//attacker.com), javascript: URIs, etc.
 *
 * @param target The raw redirect destination string
 * @param fallback The fallback path if the target is invalid (default: '/profile')
 * @returns Safe relative URL
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback = '/profile'): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();

  // Reject empty or protocol-relative URLs like '//evil.com'
  if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('\\')) {
    return fallback;
  }

  // Reject URLs containing protocols like 'https:', 'http:', 'javascript:', 'data:'
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    return fallback;
  }

  // Must start with exactly one '/'
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // Reject control characters or newlines (header injection protection)
  if (/[\r\n\0]/.test(trimmed)) {
    return fallback;
  }

  // Prevent redirect loops back to auth pages
  if (
    trimmed.startsWith('/sign-in') ||
    trimmed.startsWith('/sign-up') ||
    trimmed.startsWith('/forgot-password') ||
    trimmed.startsWith('/reset-password')
  ) {
    return fallback;
  }

  return trimmed;
}

/**
 * Checks if a path qualifies for optional skip (e.g. skipWelcome=1 / ignore_visite=true)
 */
export function canSkipWelcome(
  searchParams?: { get: (key: string) => string | null } | URLSearchParams | null
): boolean {
  if (!searchParams) return false;
  const skip =
    searchParams.get('skipWelcome') ||
    searchParams.get('skip_welcome') ||
    searchParams.get('ignore_visite');
  return skip === '1' || skip === 'true';
}