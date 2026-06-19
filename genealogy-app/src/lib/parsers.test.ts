import { describe, it, expect, vi } from 'vitest';
import { parseCSV, parseGedcom } from './parsers';
import Papa from 'papaparse';

describe('parseGedcom', () => {
  it('should parse a valid GEDCOM string', async () => {
    const gedcomContent = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
2 GIVN John
2 SURN Doe
1 BIRT
2 DATE 1 JAN 1990
2 PLAC New York
0 @I2@ INDI
1 NAME Jane /Smith/
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR`;

    const result = await parseGedcom(gedcomContent);
    expect(result.individuals.size).toBe(2);
    expect(result.families.size).toBe(1);

    const john = result.individuals.get('@I1@');
    expect(john).toEqual({
      id: '@I1@',
      name: 'John Doe ',
      givenName: 'John',
      surname: 'Doe',
      birthYear: 1990,
      birthPlace: 'New York',
    });

    const jane = result.individuals.get('@I2@');
    expect(jane).toEqual({
      id: '@I2@',
      name: 'Jane Smith ',
      givenName: 'Jane',
      surname: 'Smith',
      birthYear: undefined,
      birthPlace: undefined,
    });

    const family = result.families.get('@F1@');
    expect(family).toEqual({
      id: '@F1@',
      husband: '@I1@',
      wife: '@I2@',
      children: ['@I3@'],
    });
  });
});

describe('parseCSV', () => {
  it('should parse a valid CSV file', async () => {
    const csvContent = "Name,Shared DNA,Tree\nJohn Doe,100,http://example.com\nJane Doe,50,\n";
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCSV(file);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'John Doe', cM: 100, treeLink: 'http://example.com' });
    expect(result[1]).toEqual({ name: 'Jane Doe', cM: 50, treeLink: undefined });
  });

  it('should reject when PapaParse throws an error', async () => {
    const mockFile = new File([''], 'error.csv', { type: 'text/csv' });

    // Mock Papa.parse to immediately call the error callback
    const parseSpy = vi.spyOn(Papa, 'parse').mockImplementation((file, config) => {
      if (config && config.error) {
        config.error(new Error('Mock parsing error'), mockFile);
      }
      return null as unknown as Papa.ParseResult<unknown>;
    });

    await expect(parseCSV(mockFile)).rejects.toThrow('Mock parsing error');

    parseSpy.mockRestore();
  });
});
