export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, 'https://dummy.com');
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return url;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
