const SAFE_SCHEMES = ['http:', 'https:'];

/**
 * Returns the given URL if it resolves to an http(s) scheme, otherwise '#'.
 * Blocks javascript:/data:/vbscript: and other script-executing schemes from
 * being placed into an href by user- or API-supplied fields (e.g. evidence
 * links, proof links).
 */
export function getSafeHref(url?: string | null): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';
  try {
    const resolved = new URL(trimmed, window.location.origin);
    return SAFE_SCHEMES.includes(resolved.protocol) ? trimmed : '#';
  } catch {
    return '#';
  }
}
