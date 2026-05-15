import { describe, it, expect, vi } from 'vitest';
import { parseGedcom } from '../parsers';
import * as readGedcomModule from 'read-gedcom';

describe('parseGedcom', () => {
    describe('individual name parsing edge cases', () => {
        it('handles regular full names', async () => {
            const gedcom = `0 HEAD
1 SOUR TEST
0 @I1@ INDI
1 NAME John /Smith/
0 TRLR`;
            const data = await parseGedcom(gedcom);
            expect(data.individuals.get('@I1@')).toMatchObject({
                name: 'John Smith ',
                givenName: 'John',
                surname: 'Smith'
            });
        });

        it('handles empty given names', async () => {
            const gedcom = `0 HEAD
1 SOUR TEST
0 @I2@ INDI
1 NAME /Smith/
0 TRLR`;
            const data = await parseGedcom(gedcom);
            expect(data.individuals.get('@I2@')).toMatchObject({
                name: ' Smith ',
                givenName: '',
                surname: 'Smith'
            });
        });

        it('handles empty surnames', async () => {
            const gedcom = `0 HEAD
1 SOUR TEST
0 @I3@ INDI
1 NAME John //
0 TRLR`;
            const data = await parseGedcom(gedcom);
            expect(data.individuals.get('@I3@')).toMatchObject({
                name: 'John  ',
                givenName: 'John',
                surname: ''
            });
        });

        it('handles NAME with missing value parts', async () => {
            const gedcom = `0 HEAD
1 SOUR TEST
0 @I4@ INDI
1 NAME
0 TRLR`;
            const data = await parseGedcom(gedcom);
            expect(data.individuals.get('@I4@')).toMatchObject({
                name: 'Unknown',
                givenName: '',
                surname: ''
            });
        });

        it('handles missing NAME entirely', async () => {
            const gedcom = `0 HEAD
1 SOUR TEST
0 @I5@ INDI
0 TRLR`;
            const data = await parseGedcom(gedcom);
            expect(data.individuals.get('@I5@')).toMatchObject({
                name: 'Unknown',
                givenName: '',
                surname: ''
            });
        });

        it('handles unparsed name values (fallback to raw value)', async () => {
            // Mock readGedcom to force partsOpt to be null but value() to be present
            const mockGedcom = {
                getIndividualRecord: () => ({
                    arraySelect: () => [{
                        pointer: () => ['@I_MOCK@'],
                        getName: () => ({
                            length: 1,
                            valueAsParts: () => [null],
                            value: () => ['Raw /Name/ Value']
                        }),
                        getEventBirth: () => ({ length: 0 })
                    }]
                }),
                getFamilyRecord: () => ({ arraySelect: () => [] })
            };

            vi.spyOn(readGedcomModule, 'readGedcom').mockReturnValue(mockGedcom as any);

            const gedcom = `0 HEAD\n0 TRLR`;
            const data = await parseGedcom(gedcom);

            expect(data.individuals.get('@I_MOCK@')).toMatchObject({
                name: 'Raw Name Value',
                givenName: '',
                surname: ''
            });

            vi.restoreAllMocks();
        });

        it('handles unparsed name values (fallback to raw value with no value)', async () => {
            // Mock readGedcom to force partsOpt to be null and value() to be empty
            const mockGedcom = {
                getIndividualRecord: () => ({
                    arraySelect: () => [{
                        pointer: () => ['@I_MOCK2@'],
                        getName: () => ({
                            length: 1,
                            valueAsParts: () => [null],
                            value: () => []
                        }),
                        getEventBirth: () => ({ length: 0 })
                    }]
                }),
                getFamilyRecord: () => ({ arraySelect: () => [] })
            };

            vi.spyOn(readGedcomModule, 'readGedcom').mockReturnValue(mockGedcom as any);

            const gedcom = `0 HEAD\n0 TRLR`;
            const data = await parseGedcom(gedcom);

            expect(data.individuals.get('@I_MOCK2@')).toMatchObject({
                name: 'Unknown',
                givenName: '',
                surname: ''
            });

            vi.restoreAllMocks();
        });
    });
});
