export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.toString();
    }
  } catch {
    // Invalid URL
  }

  return undefined;
}
