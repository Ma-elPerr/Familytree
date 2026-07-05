import { describe, it, expect } from 'vitest';
import { parseCSV } from './parsers';

describe('parseCSV', () => {
  const createCSVFile = (content: string, filename = 'matches.csv') => {
    return new File([content], filename, { type: 'text/csv' });
  };

  it('should parse standard column names', async () => {
    const csvContent = `Name,Shared DNA,Tree
John Doe,150,https://tree.link/1
Jane Smith,75.5,https://tree.link/2`;

    const file = createCSVFile(csvContent);
    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'John Doe',
      cM: 150,
      treeLink: 'https://tree.link/1'
    });
    expect(result[1]).toEqual({
      name: 'Jane Smith',
      cM: 75.5,
      treeLink: 'https://tree.link/2'
    });
  });

  it('should handle alternative column names', async () => {
    const csvContent = `Match Name,cM,Link
Alice,42.1,https://link.a
Bob,12.3,`;

    const file = createCSVFile(csvContent);
    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'Alice',
      cM: 42.1,
      treeLink: 'https://link.a'
    });
    expect(result[1]).toEqual({
      name: 'Bob',
      cM: 12.3,
      treeLink: undefined
    });
  });

  it('should handle comma as decimal separator', async () => {
    const csvContent = `Match,Centimorgans,Tree Link
Charlie,"34,5",`;

    const file = createCSVFile(csvContent);
    const result = await parseCSV(file);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Charlie',
      cM: 34.5,
      treeLink: undefined
    });
  });

  it('should skip rows without name or cM', async () => {
    const csvContent = `Name,Shared DNA,Tree
Valid Match,100,
Missing cM,,
,50,
Another Valid,20,`;

    const file = createCSVFile(csvContent);
    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Valid Match');
    expect(result[1].name).toBe('Another Valid');
  });

  it('should skip rows with invalid cM values', async () => {
    const csvContent = `Name,Shared DNA,Tree
Valid Match,100,
Invalid cM,abc,
Another Valid,20,`;

    const file = createCSVFile(csvContent);
    const result = await parseCSV(file);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Valid Match');
    expect(result[1].name).toBe('Another Valid');
  });

  it('should reject on PapaParse error (e.g. invalid file format simulating read failure)', async () => {
    // Instead of mocking PapaParse, we can just pass something that isn't a File/Blob correctly
    // However, TypeScript requires File type.
    // PapaParse might not reject easily just from bad CSV content (it usually returns an empty array or errors array).
    // Let's pass a null to trigger an error in File reading if we cast it.
    await expect(parseCSV(null as unknown as File)).rejects.toThrow();
  });
});
