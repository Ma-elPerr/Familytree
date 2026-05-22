import { describe, it, expect } from 'vitest';
import { parseGedcom } from '../parsers';

// A valid GEDCOM string as a fixture to test the parsing logic.
const sampleGedcom = `0 HEAD
1 SOUR TEST
0 @I1@ INDI
1 NAME John /Doe/
1 SEX M
1 BIRT
2 DATE 1980
2 PLAC New York
0 @I2@ INDI
1 NAME Jane /Smith/
1 SEX F
1 BIRT
2 DATE 1982
2 PLAC London
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 @I3@ INDI
1 NAME Jimmy /Doe/
1 SEX M
0 TRLR`;

describe('parseGedcom', () => {
  it('should correctly parse individuals and families from a GEDCOM string', async () => {
    const data = await parseGedcom(sampleGedcom);

    // Test individuals
    expect(data.individuals.size).toBe(3);

    const john = data.individuals.get('@I1@');
    expect(john).toBeDefined();
    expect(john?.id).toBe('@I1@');
    expect(john?.name).toBe('John Doe');
    expect(john?.givenName).toBe('John');
    expect(john?.surname).toBe('Doe');
    expect(john?.birthYear).toBe(1980);
    expect(john?.birthPlace).toBe('New York');

    const jane = data.individuals.get('@I2@');
    expect(jane).toBeDefined();
    expect(jane?.id).toBe('@I2@');
    expect(jane?.name).toBe('Jane Smith');
    expect(jane?.givenName).toBe('Jane');
    expect(jane?.surname).toBe('Smith');
    expect(jane?.birthYear).toBe(1982);
    expect(jane?.birthPlace).toBe('London');

    const jimmy = data.individuals.get('@I3@');
    expect(jimmy).toBeDefined();
    expect(jimmy?.id).toBe('@I3@');
    expect(jimmy?.name).toBe('Jimmy Doe');
    expect(jimmy?.givenName).toBe('Jimmy');
    expect(jimmy?.surname).toBe('Doe');
    expect(jimmy?.birthYear).toBeUndefined();
    expect(jimmy?.birthPlace).toBeUndefined();

    // Test families
    expect(data.families.size).toBe(1);

    const fam = data.families.get('@F1@');
    expect(fam).toBeDefined();
    expect(fam?.id).toBe('@F1@');
    expect(fam?.husband).toBe('@I1@');
    expect(fam?.wife).toBe('@I2@');
    expect(fam?.children).toEqual(['@I3@']);
  });

  it('should handle GEDCOM with minimal data', async () => {
    const minimalGedcom = `0 HEAD
0 @I1@ INDI
0 TRLR`;

    const data = await parseGedcom(minimalGedcom);

    expect(data.individuals.size).toBe(1);
    const ind = data.individuals.get('@I1@');
    expect(ind).toBeDefined();
    expect(ind?.id).toBe('@I1@');
    expect(ind?.name).toBe('Unknown');
    expect(ind?.givenName).toBe('');
    expect(ind?.surname).toBe('');
    expect(ind?.birthYear).toBeUndefined();
    expect(ind?.birthPlace).toBeUndefined();

    expect(data.families.size).toBe(0);
  });

  it('should handle GEDCOM with un-formatted name string', async () => {
      const minimalGedcom = `0 HEAD
0 @I1@ INDI
1 NAME UnknownName
0 TRLR`;

      const data = await parseGedcom(minimalGedcom);

      expect(data.individuals.size).toBe(1);
      const ind = data.individuals.get('@I1@');
      expect(ind).toBeDefined();
      expect(ind?.id).toBe('@I1@');
      expect(ind?.name).toBe('UnknownName');
  });

  it('should handle GEDCOM without birth date or place string', async () => {
      const minimalGedcom = `0 HEAD
0 @I1@ INDI
1 NAME UnknownName
1 BIRT
0 TRLR`;

      const data = await parseGedcom(minimalGedcom);

      expect(data.individuals.size).toBe(1);
      const ind = data.individuals.get('@I1@');
      expect(ind).toBeDefined();
      expect(ind?.id).toBe('@I1@');
      expect(ind?.name).toBe('UnknownName');
      expect(ind?.birthYear).toBeUndefined();
      expect(ind?.birthPlace).toBeUndefined();
  });
});
