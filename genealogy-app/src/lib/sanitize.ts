export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return parsedUrl.href;
    }
    return undefined;
  } catch {
    // If it's a valid relative path, you might want to allow it depending on context.
    // For external links in CSVs, they should probably be absolute URLs with http/https.
    return undefined;
  }
}
