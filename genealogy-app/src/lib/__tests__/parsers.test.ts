import { describe, it, expect } from 'vitest';
import { parseGedcom, parseCSV } from '../parsers';

describe('parsers', () => {
  describe('parseGedcom', () => {
    it('should parse a simple GEDCOM file correctly', async () => {
      const gedcomData = `0 HEAD
1 SOUR TEST
0 @I1@ INDI
1 NAME John /Doe/
2 GIVN John
2 SURN Doe
1 BIRT
2 DATE 1 Jan 1900
2 PLAC New York
0 @I2@ INDI
1 NAME Jane /Smith/
1 BIRT
2 DATE 1905
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR`;

      const result = await parseGedcom(gedcomData);

      expect(result.individuals.size).toBe(2);
      expect(result.families.size).toBe(1);

      const john = result.individuals.get('@I1@');
      expect(john).toBeDefined();
      expect(john?.name).toBe('John Doe');
      expect(john?.givenName).toBe('John');
      expect(john?.surname).toBe('Doe');
      expect(john?.birthYear).toBe(1900);
      expect(john?.birthPlace).toBe('New York');

      const jane = result.individuals.get('@I2@');
      expect(jane).toBeDefined();
      expect(jane?.name).toBe('Jane Smith');
      expect(jane?.birthYear).toBe(1905);

      const fam = result.families.get('@F1@');
      expect(fam).toBeDefined();
      expect(fam?.husband).toBe('@I1@');
      expect(fam?.wife).toBe('@I2@');
      expect(fam?.children).toEqual(['@I3@']);
    });

    it('should handle individuals with no name or birth data gracefully', async () => {
      const gedcomData = `0 HEAD
0 @I1@ INDI
0 TRLR`;

      const result = await parseGedcom(gedcomData);

      const indiv = result.individuals.get('@I1@');
      expect(indiv).toBeDefined();
      expect(indiv?.name).toBe('Unknown');
      expect(indiv?.givenName).toBe('');
      expect(indiv?.surname).toBe('');
      expect(indiv?.birthYear).toBeUndefined();
      expect(indiv?.birthPlace).toBeUndefined();
    });
  });

  describe('parseCSV', () => {
    it('should parse a CSV file and map to DNAMatch correctly', async () => {
      const csvData = `Name,Shared DNA,Tree Link
John Doe,50.5,https://example.com/tree1
Jane Smith,120,https://example.com/tree2
Invalid Row,,`;

      const file = new File([csvData], 'matches.csv', { type: 'text/csv' });
      const result = await parseCSV(file);

      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        name: 'John Doe',
        cM: 50.5,
        treeLink: 'https://example.com/tree1'
      });

      expect(result[1]).toEqual({
        name: 'Jane Smith',
        cM: 120,
        treeLink: 'https://example.com/tree2'
      });
    });

    it('should handle different column names flexibly', async () => {
      const csvData = `Match Name,Centimorgans,Link
Bob,25.2,
Alice,30,http://test.com`;

      const file = new File([csvData], 'matches.csv', { type: 'text/csv' });
      const result = await parseCSV(file);

      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        name: 'Bob',
        cM: 25.2,
        treeLink: undefined
      });

      expect(result[1]).toEqual({
        name: 'Alice',
        cM: 30,
        treeLink: 'http://test.com'
      });
    });

    it('should handle CSV parse errors', async () => {
      // Simulate an error by passing a bad object instead of a File
      // Papa.parse throws when it receives something it can't parse as a file/string in browser mode
      await expect(parseCSV({} as File)).rejects.toThrow();
    });
  });
});
