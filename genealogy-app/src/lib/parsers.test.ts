import { describe, it, expect } from 'vitest';
import { parseCSV } from './parsers';

describe('parseCSV', () => {
  it('should parse a basic CSV with standard column names (Name, Shared DNA, Tree)', async () => {
    const csvContent = `Name,Shared DNA,Tree\nJohn Doe,345.6,https://tree.com/john`;
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      name: 'John Doe',
      cM: 345.6,
      treeLink: 'https://tree.com/john'
    });
  });

  it('should support alternative column names for Name, cM, and Tree', async () => {
    const csvContent = `Match Name,Centimorgans,Tree Link\nJane Smith,120,https://tree.com/jane`;
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      name: 'Jane Smith',
      cM: 120,
      treeLink: 'https://tree.com/jane'
    });
  });

  it('should correctly parse cM values using commas as decimal separators', async () => {
    // Note: since it's CSV, values with commas must be enclosed in quotes
    const csvContent = `Match,cM,Link\nCarlos,"123,45",https://tree.com/carlos`;
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      name: 'Carlos',
      cM: 123.45,
      treeLink: 'https://tree.com/carlos'
    });
  });

  it('should skip rows that do not have both a valid name and cM value', async () => {
    const csvContent = `Name,Shared DNA,Tree\nMissing CM,,https://tree.com/missing\n,100,https://tree.com/noname\nValid Name,50.5,https://tree.com/valid\n`;
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      name: 'Valid Name',
      cM: 50.5,
      treeLink: 'https://tree.com/valid'
    });
  });

  it('should skip rows where cM value cannot be parsed to a valid number', async () => {
    const csvContent = `Name,Shared DNA,Tree\nInvalid CM,NotANumber,https://tree.com/invalid`;
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);

    expect(result.length).toBe(0);
  });

  it('should correctly handle missing tree link (optional)', async () => {
    const csvContent = `Name,Shared DNA\nNo Tree,75.2`;
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      name: 'No Tree',
      cM: 75.2,
      treeLink: undefined
    });
  });

  it('should support alternative name and cM variants like "name" and "Shared cM"', async () => {
    const csvContent = `name,Shared cM\nlowercase,88`;
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      name: 'lowercase',
      cM: 88,
      treeLink: undefined
    });
  });
});
