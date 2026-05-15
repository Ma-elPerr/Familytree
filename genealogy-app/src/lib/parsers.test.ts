import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseCSV } from './parsers';
import Papa from 'papaparse';

describe('parseCSV', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse valid CSV files with standard column names', async () => {
    const csvContent = `Name,Shared DNA,Tree Link\nJohn Doe,100,https://example.com\nJane Doe,50,`;
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });

    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'John Doe',
      cM: 100,
      treeLink: 'https://example.com'
    });
    expect(result[1]).toEqual({
      name: 'Jane Doe',
      cM: 50,
      treeLink: undefined
    });
  });

  it('should handle alternative column names', async () => {
    const csvContent = `Match Name,Centimorgans,Tree\nJohn Doe,100,https://example.com\nJane Doe,50,`;
    const file = new File([csvContent], 'matches2.csv', { type: 'text/csv' });

    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'John Doe',
      cM: 100,
      treeLink: 'https://example.com'
    });
  });

  it('should handle comma as a decimal separator for cM values', async () => {
    const csvContent = `Name,Shared DNA,Tree Link\nJohn Doe,"100,5",https://example.com\nJane Doe,50.2,`;
    const file = new File([csvContent], 'matches3.csv', { type: 'text/csv' });

    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
    expect(result[0].cM).toBe(100.5);
    expect(result[1].cM).toBe(50.2);
  });

  it('should skip rows with missing required columns', async () => {
    const csvContent = `Name,Shared DNA,Tree Link\n,100,https://example.com\nJane Doe,,`;
    const file = new File([csvContent], 'matches4.csv', { type: 'text/csv' });

    const result = await parseCSV(file);

    expect(result).toHaveLength(0);
  });

  it('should skip rows with invalid cM values', async () => {
    const csvContent = `Name,Shared DNA,Tree Link\nJohn Doe,invalid,https://example.com\nJane Doe,50,`;
    const file = new File([csvContent], 'matches5.csv', { type: 'text/csv' });

    const result = await parseCSV(file);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Jane Doe',
      cM: 50,
      treeLink: undefined
    });
  });

  it('should reject when Papa.parse encounters an error', async () => {
    const file = new File([''], 'error.csv', { type: 'text/csv' });

    // Mock Papa.parse to immediately call the error callback
    vi.spyOn(Papa, 'parse').mockImplementation((_file, config) => {
      // @ts-expect-error Mocking overload
      if (config && typeof config === 'object' && 'error' in config && typeof config.error === 'function') {
        config.error(new Error('Papa.parse error'), file);
      }
      return null as any;
    });

    await expect(parseCSV(file)).rejects.toThrow('Papa.parse error');
  });
});
