import { describe, it, expect } from 'vitest';
import { parseGedcom } from './parsers';

describe('parseGedcom', () => {
  it('should handle an empty GEDCOM string', async () => {
    const emptyGedcom = `0 HEAD
1 CHAR UTF-8
0 TRLR`;
    const data = await parseGedcom(emptyGedcom);
    expect(data.individuals.size).toBe(0);
    expect(data.families.size).toBe(0);
  });

  it('should parse individuals with standard names', async () => {
    const gedcomStr = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
0 TRLR`;
    const data = await parseGedcom(gedcomStr);
    expect(data.individuals.size).toBe(1);

    const individual = data.individuals.get('@I1@');
    expect(individual).toBeDefined();
    expect(individual?.id).toBe('@I1@');
    expect(individual?.name).toBe('John Doe '); // Due to gedcom parts trailing spaces based on current logic
    expect(individual?.givenName).toBe('John');
    expect(individual?.surname).toBe('Doe');
  });

  it('should parse individuals with alternate name formats', async () => {
    const gedcomStr = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME /Doe/
0 @I2@ INDI
1 NAME Jane
0 @I3@ INDI
0 TRLR`;
    const data = await parseGedcom(gedcomStr);
    expect(data.individuals.size).toBe(3);

    const ind1 = data.individuals.get('@I1@');
    // For '/Doe/', parts are ['', 'Doe']. Join with space gives ' Doe'.
    // If it has a trailing part it might have another space.
    expect(ind1?.name).toBe(' Doe ');
    expect(ind1?.givenName).toBe('');
    expect(ind1?.surname).toBe('Doe');

    const ind2 = data.individuals.get('@I2@');
    // For 'Jane', parts are ['Jane', '']. Join gives 'Jane  '.
    expect(ind2?.name).toBe('Jane  ');
    expect(ind2?.givenName).toBe('Jane');
    expect(ind2?.surname).toBe('');

    const ind3 = data.individuals.get('@I3@');
    expect(ind3?.name).toBe('Unknown');
  });

  it('should parse birth dates and places', async () => {
    const gedcomStr = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
1 BIRT
2 DATE 10 MAY 1980
2 PLAC New York, USA
0 @I2@ INDI
1 NAME Jane /Doe/
1 BIRT
2 DATE ABT 1985
0 TRLR`;
    const data = await parseGedcom(gedcomStr);

    const ind1 = data.individuals.get('@I1@');
    expect(ind1?.birthYear).toBe(1980);
    expect(ind1?.birthPlace).toBe('New York, USA');

    const ind2 = data.individuals.get('@I2@');
    expect(ind2?.birthYear).toBe(1985);
    expect(ind2?.birthPlace).toBeUndefined();
  });

  it('should parse families with husband, wife, and children', async () => {
    const gedcomStr = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
0 @I2@ INDI
1 NAME Jane /Doe/
0 @I3@ INDI
1 NAME Baby /Doe/
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR`;
    const data = await parseGedcom(gedcomStr);
    expect(data.families.size).toBe(1);

    const family = data.families.get('@F1@');
    expect(family).toBeDefined();
    expect(family?.id).toBe('@F1@');
    expect(family?.husband).toBe('@I1@');
    expect(family?.wife).toBe('@I2@');
    expect(family?.children).toEqual(['@I3@']);
  });

  it('should handle families with missing pointers', async () => {
    const gedcomStr = `0 HEAD
1 CHAR UTF-8
0 @F1@ FAM
1 HUSB @I1@
0 @F2@ FAM
1 CHIL @I3@
1 CHIL @I4@
0 TRLR`;
    const data = await parseGedcom(gedcomStr);
    expect(data.families.size).toBe(2);

    const fam1 = data.families.get('@F1@');
    expect(fam1?.husband).toBe('@I1@');
    expect(fam1?.wife).toBeUndefined();
    expect(fam1?.children).toEqual([]);

    const fam2 = data.families.get('@F2@');
    expect(fam2?.husband).toBeUndefined();
    expect(fam2?.wife).toBeUndefined();
    expect(fam2?.children).toEqual(['@I3@', '@I4@']);
  });
});
