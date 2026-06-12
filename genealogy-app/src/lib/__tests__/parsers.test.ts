import { describe, it, expect } from 'vitest';
import { parseGedcom } from '../parsers';

describe('parseGedcom', () => {
  it('should handle empty input', async () => {
    const data = await parseGedcom('');
    expect(data.individuals.size).toBe(0);
    expect(data.families.size).toBe(0);
  });

  it('should parse standard GEDCOM data correctly', async () => {
    const gedcomStr = `0 HEAD
1 SOUR PAF
2 NAME Personal Ancestral File
2 VERS 5.0
1 DEST PAF
1 DATE 10 MAY 2024
0 @I1@ INDI
1 NAME Patricia /Perrucci/
1 SEX F
1 BIRT
2 DATE 1980
2 PLAC Sao Paulo
1 FAMC @F1@
0 @I2@ INDI
1 NAME Joao /Perrucci/
1 SEX M
1 BIRT
2 DATE 1950
1 FAMS @F1@
1 FAMC @F2@
0 @I3@ INDI
1 NAME Maria /Silva/
1 SEX F
1 BIRT
2 DATE 1952
1 FAMS @F1@
0 @I4@ INDI
1 NAME Antonio /Perrucci/
1 SEX M
1 BIRT
2 DATE 1920
1 FAMS @F2@
0 @I5@ INDI
1 NAME Ana /Parigot/
1 SEX F
1 BIRT
2 DATE 1925
1 FAMS @F2@
0 @F1@ FAM
1 HUSB @I2@
1 WIFE @I3@
1 CHIL @I1@
0 @F2@ FAM
1 HUSB @I4@
1 WIFE @I5@
1 CHIL @I2@
0 TRLR`;

    const data = await parseGedcom(gedcomStr);
    expect(data.individuals.size).toBe(5);
    expect(data.families.size).toBe(2);

    const i1 = data.individuals.get('@I1@');
    expect(i1).toBeDefined();
    expect(i1?.name).toBe('Patricia Perrucci');
    expect(i1?.givenName).toBe('Patricia');
    expect(i1?.surname).toBe('Perrucci');
    expect(i1?.birthYear).toBe(1980);
    expect(i1?.birthPlace).toBe('Sao Paulo');

    const f1 = data.families.get('@F1@');
    expect(f1).toBeDefined();
    expect(f1?.husband).toBe('@I2@');
    expect(f1?.wife).toBe('@I3@');
    expect(f1?.children).toContain('@I1@');
  });

  it('should clean up formatting characters and extract year', async () => {
    const gedcomStr = `0 HEAD
1 SOUR PAF
0 @I1@ INDI
1 NAME John /Doe/
1 BIRT
2 DATE 12 JAN 1990
0 TRLR`;

    const data = await parseGedcom(gedcomStr);
    const ind = data.individuals.get('@I1@');

    expect(ind?.name).toBe('John Doe'); // Verify slashes are removed
    expect(ind?.givenName).toBe('John');
    expect(ind?.surname).toBe('Doe');
    expect(ind?.birthYear).toBe(1990); // Verify year extraction
  });

  it('should handle missing date or place', async () => {
     const gedcomStr = `0 HEAD
1 SOUR PAF
0 @I1@ INDI
1 NAME John /Doe/
1 BIRT
0 TRLR`;
     const data = await parseGedcom(gedcomStr);
     const ind = data.individuals.get('@I1@');
     expect(ind?.birthYear).toBeUndefined();
     expect(ind?.birthPlace).toBeUndefined();
  });
});
