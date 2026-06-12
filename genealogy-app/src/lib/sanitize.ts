export function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined;

  const trimmedUrl = url.trim();
  const lowerUrl = trimmedUrl.toLowerCase();

  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  return '#';
}
