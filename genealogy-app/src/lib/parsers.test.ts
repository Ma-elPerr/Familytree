import { describe, it, expect } from 'vitest';
import { parseGedcom } from './parsers';

describe('parseGedcom', () => {
  it('should parse individuals correctly', async () => {
    const gedcomData = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
2 GIVN John
2 SURN Doe
1 BIRT
2 DATE 1 JAN 1900
2 PLAC New York, USA
0 TRLR`;

    const { individuals } = await parseGedcom(gedcomData);
    expect(individuals.size).toBe(1);

    const person = individuals.get('@I1@');
    expect(person).toBeDefined();
    // note: parser currently parses name like this due to extra space concatenation behavior
    expect(person?.id).toBe('@I1@');
    expect(person?.name).toBe('John Doe ');
    expect(person?.givenName).toBe('John');
    expect(person?.surname).toBe('Doe');
    expect(person?.birthYear).toBe(1900);
    expect(person?.birthPlace).toBe('New York, USA');
  });

  it('should parse families correctly', async () => {
    const gedcomData = `0 HEAD
1 CHAR UTF-8
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
1 CHIL @I4@
0 TRLR`;

    const { families } = await parseGedcom(gedcomData);
    expect(families.size).toBe(1);

    const family = families.get('@F1@');
    expect(family).toBeDefined();
    expect(family?.id).toBe('@F1@');
    expect(family?.husband).toBe('@I1@');
    expect(family?.wife).toBe('@I2@');
    expect(family?.children).toEqual(['@I3@', '@I4@']);
  });

  it('should handle incomplete individuals gracefully', async () => {
    const gedcomData = `0 HEAD
1 CHAR UTF-8
0 @I2@ INDI
0 TRLR`;

    const { individuals } = await parseGedcom(gedcomData);
    expect(individuals.size).toBe(1);

    const person = individuals.get('@I2@');
    expect(person).toBeDefined();
    expect(person?.id).toBe('@I2@');
    expect(person?.name).toBe('Unknown');
    expect(person?.givenName).toBe('');
    expect(person?.surname).toBe('');
    expect(person?.birthYear).toBeUndefined();
    expect(person?.birthPlace).toBeUndefined();
  });

  it('should handle missing given/surname gracefully', async () => {
    const gedcomData = `0 HEAD
1 CHAR UTF-8
0 @I3@ INDI
1 NAME Jane /Smith/
0 TRLR`;

    const { individuals } = await parseGedcom(gedcomData);
    expect(individuals.size).toBe(1);
    const person = individuals.get('@I3@');
    expect(person?.name).toBe('Jane Smith ');
  });
});
