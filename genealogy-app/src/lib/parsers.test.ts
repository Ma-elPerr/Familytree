import { describe, it, expect } from 'vitest';
import { parseCSV } from './parsers';

describe('parseCSV', () => {
  it('should parse valid CSV', async () => {
    const csvContent = `Name,Shared DNA,Tree Link\nJohn Doe,120,https://tree.link\nJane,50,`;
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const result = await parseCSV(file);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('John Doe');
    expect(result[0].cM).toBe(120);
    expect(result[0].treeLink).toBe('https://tree.link');
  });
});
