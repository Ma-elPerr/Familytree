import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from '../sanitize';

describe('sanitizeUrl', () => {
  it('should return undefined for undefined or empty input', () => {
    expect(sanitizeUrl(undefined)).toBeUndefined();
    expect(sanitizeUrl('')).toBeUndefined();
  });

  it('should return the original URL for valid http and https protocols', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('https://example.com/path?query=1')).toBe('https://example.com/path?query=1');
  });

  it('should return undefined for javascript protocols (XSS prevention)', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeUrl('javascript:confirm(1)')).toBeUndefined();
    expect(sanitizeUrl('javascript:prompt(1)')).toBeUndefined();
    expect(sanitizeUrl(' javascript:alert(1)')).toBeUndefined();
  });

  it('should return undefined for other invalid or dangerous protocols', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(sanitizeUrl('vbscript:msgbox("hello")')).toBeUndefined();
  });

  it('should return undefined for relative paths', () => {
    // Relative paths won't parse with `new URL()` unless a base is provided
    expect(sanitizeUrl('/path/to/resource')).toBeUndefined();
    expect(sanitizeUrl('path/to/resource')).toBeUndefined();
  });
});
