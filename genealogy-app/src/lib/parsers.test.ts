import { describe, it, expect } from 'vitest';
import { parseGedcom } from './parsers';

describe('parseGedcom', () => {
  it('should parse individuals and families correctly', async () => {
    const gedcomContent = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
1 BIRT
2 DATE 1980
2 PLAC New York
0 @I2@ INDI
1 NAME Jane /Smith/
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR
`;
    const result = await parseGedcom(gedcomContent);
    expect(result.individuals.size).toBe(2);
    expect(result.families.size).toBe(1);

    const john = result.individuals.get('@I1@');
    expect(john).toBeDefined();
    // Use .trim() if needed, but in my test string it's just 'John Doe'
    expect(john?.name?.trim()).toBe('John Doe');
    expect(john?.givenName?.trim()).toBe('John');
    expect(john?.surname?.trim()).toBe('Doe');
    expect(john?.birthYear).toBe(1980);
    expect(john?.birthPlace?.trim()).toBe('New York');

    const jane = result.individuals.get('@I2@');
    expect(jane).toBeDefined();
    expect(jane?.name?.trim()).toBe('Jane Smith');

    const family = result.families.get('@F1@');
    expect(family).toBeDefined();
    expect(family?.husband).toBe('@I1@');
    expect(family?.wife).toBe('@I2@');
    expect(family?.children).toEqual(['@I3@']);
  });

  it('should handle missing and partial data gracefully', async () => {
    const gedcomContent = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
0 @I2@ INDI
1 NAME /OnlySurname/
0 @I3@ INDI
1 NAME OnlyGivenName /
0 @I4@ INDI
1 NAME JustName
0 @F1@ FAM
0 TRLR
`;
    const result = await parseGedcom(gedcomContent);

    // I1 has no name
    const i1 = result.individuals.get('@I1@');
    expect(i1?.name).toBe('Unknown');

    // I2 has only surname
    const i2 = result.individuals.get('@I2@');
    expect(i2?.surname).toBe('OnlySurname');

    // I3 has only given name - read-gedcom parses "OnlyGivenName /" as value not valueAsParts due to invalid GEDCOM trailing space or single slash without surname block. The implementation falls back to nameStr = val.replace(/\//g, '').
    const i3 = result.individuals.get('@I3@');
    expect(i3?.name?.trim()).toBe('OnlyGivenName');
    // givenName relies on valueAsParts which is null here
    expect(i3?.givenName).toBe('');

    // I4 has just a name without slashes
    const i4 = result.individuals.get('@I4@');
    expect(i4?.name?.trim()).toBe('JustName');

    const f1 = result.families.get('@F1@');
    expect(f1?.husband).toBeUndefined();
    expect(f1?.wife).toBeUndefined();
    expect(f1?.children).toEqual([]);
  });

  it('should handle unparseable dates gracefully', async () => {
    const gedcomContent = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
1 BIRT
2 DATE Unknown
2 PLAC New York
0 TRLR
`;
    const result = await parseGedcom(gedcomContent);
    const john = result.individuals.get('@I1@');
    expect(john).toBeDefined();
    expect(john?.birthYear).toBeUndefined();
    expect(john?.birthPlace?.trim()).toBe('New York');
  });
});
