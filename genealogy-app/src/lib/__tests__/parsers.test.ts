import { describe, it, expect } from 'vitest';
import { parseCSV } from '../parsers';

describe('parseCSV', () => {
  it('should parse basic CSV correctly', async () => {
    const csvContent = 'Name,Shared DNA,Tree\nJohn Doe,100,https://tree.com\nJane Doe,50,';
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const matches = await parseCSV(file);

    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ name: 'John Doe', cM: 100, treeLink: 'https://tree.com' });
    expect(matches[1]).toEqual({ name: 'Jane Doe', cM: 50, treeLink: undefined });
  });

  it('should handle different column names flexibly', async () => {
    const csvContent = 'Match Name,cM,Tree Link\nBob,75,https://bob.com';
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const matches = await parseCSV(file);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ name: 'Bob', cM: 75, treeLink: 'https://bob.com' });
  });

  it('should handle missing tree link correctly', async () => {
    const csvContent = 'Match Name,cM\nBob,75';
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const matches = await parseCSV(file);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ name: 'Bob', cM: 75, treeLink: undefined });
  });

  it('should handle alternative column names (Match, Centimorgans, Link)', async () => {
    const csvContent = 'Match,Centimorgans,Link\nAlice,120.5,https://alice.com';
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const matches = await parseCSV(file);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ name: 'Alice', cM: 120.5, treeLink: 'https://alice.com' });
  });

  it('should handle alternative column names (name, Shared cM)', async () => {
    const csvContent = 'name,Shared cM\nCharlie,30';
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const matches = await parseCSV(file);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ name: 'Charlie', cM: 30, treeLink: undefined });
  });

  it('should filter out rows with invalid or missing cM', async () => {
    const csvContent = 'Name,Shared DNA\nDavid,invalid\nEve,\nFrank,50';
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const matches = await parseCSV(file);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ name: 'Frank', cM: 50, treeLink: undefined });
  });

  it('should handle comma as decimal separator', async () => {
    const csvContent = 'Name,Shared DNA\nGrace,"45,5"';
    const file = new File([csvContent], 'matches.csv', { type: 'text/csv' });
    const matches = await parseCSV(file);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ name: 'Grace', cM: 45.5, treeLink: undefined });
  });
});
