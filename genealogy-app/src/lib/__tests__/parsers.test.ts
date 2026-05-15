import { describe, it, expect } from 'vitest';
import { parseGedcom } from '../parsers';

describe('parseGedcom', () => {
  it('should parse individuals and families from valid GEDCOM data', async () => {
    const gedcomData = `0 HEAD
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
0 @F1@ FAM
1 HUSB @I2@
1 WIFE @I3@
1 CHIL @I1@
0 TRLR`;

    const result = await parseGedcom(gedcomData);

    expect(result.individuals.size).toBe(3);
    expect(result.families.size).toBe(1);

    const patricia = result.individuals.get('@I1@');
    expect(patricia).toBeDefined();
    expect(patricia?.name.trim()).toBe('Patricia Perrucci');
    expect(patricia?.givenName.trim()).toBe('Patricia');
    expect(patricia?.surname.trim()).toBe('Perrucci');
    expect(patricia?.birthYear).toBe(1980);
    expect(patricia?.birthPlace).toBe('Sao Paulo');

    const joao = result.individuals.get('@I2@');
    expect(joao).toBeDefined();
    expect(joao?.name.trim()).toBe('Joao Perrucci');
    expect(joao?.givenName.trim()).toBe('Joao');
    expect(joao?.surname.trim()).toBe('Perrucci');
    expect(joao?.birthYear).toBe(1950);
    expect(joao?.birthPlace).toBeUndefined();

    const family = result.families.get('@F1@');
    expect(family).toBeDefined();
    expect(family?.husband).toBe('@I2@');
    expect(family?.wife).toBe('@I3@');
    expect(family?.children).toEqual(['@I1@']);
  });

  it('should handle individuals with missing or malformed data', async () => {
    const gedcomData = `0 HEAD
1 SOUR PAF
0 @I1@ INDI
1 NAME UnknownName
0 @I2@ INDI
1 NAME /OnlySurname/
1 BIRT
2 DATE ABT 1900
0 @I3@ INDI
1 NAME JustGivenName
1 BIRT
2 DATE InvalidDate
0 TRLR`;

    const result = await parseGedcom(gedcomData);

    expect(result.individuals.size).toBe(3);

    const i1 = result.individuals.get('@I1@');
    expect(i1?.name.trim()).toBe('UnknownName');
    expect(i1?.givenName.trim()).toBe('UnknownName');
    expect(i1?.surname.trim()).toBe('');
    expect(i1?.birthYear).toBeUndefined();

    const i2 = result.individuals.get('@I2@');
    expect(i2?.name.trim()).toBe('OnlySurname');
    expect(i2?.givenName.trim()).toBe('');
    expect(i2?.surname.trim()).toBe('OnlySurname');
    expect(i2?.birthYear).toBe(1900);

    const i3 = result.individuals.get('@I3@');
    expect(i3?.name.trim()).toBe('JustGivenName');
    expect(i3?.givenName.trim()).toBe('JustGivenName');
    expect(i3?.surname.trim()).toBe('');
    expect(i3?.birthYear).toBeUndefined();
  });

  it('should handle families with missing husband, wife, or children', async () => {
    const gedcomData = `0 HEAD
1 SOUR PAF
0 @F1@ FAM
1 HUSB @I1@
0 @F2@ FAM
1 WIFE @I2@
0 @F3@ FAM
1 CHIL @I3@
1 CHIL @I4@
0 TRLR`;

    const result = await parseGedcom(gedcomData);

    expect(result.families.size).toBe(3);

    const f1 = result.families.get('@F1@');
    expect(f1?.husband).toBe('@I1@');
    expect(f1?.wife).toBeUndefined();
    expect(f1?.children).toEqual([]);

    const f2 = result.families.get('@F2@');
    expect(f2?.husband).toBeUndefined();
    expect(f2?.wife).toBe('@I2@');
    expect(f2?.children).toEqual([]);

    const f3 = result.families.get('@F3@');
    expect(f3?.husband).toBeUndefined();
    expect(f3?.wife).toBeUndefined();
    expect(f3?.children).toEqual(['@I3@', '@I4@']);
  });
});
