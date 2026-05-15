import { matchDNA } from './algorithms';
import { GenealogyGraph } from './graph';
import { DNAMatch } from './parsers';

describe('matchDNA', () => {
  let mockGraph: GenealogyGraph;

  beforeEach(() => {
    mockGraph = new Map();

    // Add some test individuals
    mockGraph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    });
    mockGraph.set('I2', {
      individual: { id: 'I2', name: 'Jane Smith', givenName: 'Jane', surname: 'Smith' },
      parents: [], children: [], spouses: []
    });
    mockGraph.set('I3', {
      individual: { id: 'I3', name: 'William Shakespeare', givenName: 'William', surname: 'Shakespeare' },
      parents: [], children: [], spouses: []
    });
    mockGraph.set('I4', {
      individual: { id: 'I4', name: 'Albus Percival Wulfric Brian Dumbledore', givenName: 'Albus', surname: 'Dumbledore' },
      parents: [], children: [], spouses: []
    });
  });

  it('handles empty DNA matches and empty graph', () => {
    expect(matchDNA([], new Map())).toEqual([]);
    expect(matchDNA([], mockGraph)).toEqual([]);
  });

  it('handles empty graph with DNA matches', () => {
    const matches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];
    const result = matchDNA(matches, new Map());

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      dnaMatch: matches[0],
      matchedIndividualId: undefined,
      matchedIndividualName: undefined,
      status: 'Não Localizado'
    });
  });

  it('matches exactly (case insensitive)', () => {
    const matches: DNAMatch[] = [
      { name: 'John Doe', cM: 100 },
      { name: 'JANE SMITH', cM: 200 }
    ];

    const result = matchDNA(matches, mockGraph);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      matchedIndividualId: 'I1',
      matchedIndividualName: 'John Doe',
      status: 'Localizado'
    });
    expect(result[1]).toMatchObject({
      matchedIndividualId: 'I2',
      matchedIndividualName: 'Jane Smith',
      status: 'Localizado'
    });
  });

  it('matches partially when match name includes graph name or vice versa', () => {
    const matches: DNAMatch[] = [
      { name: 'William', cM: 50 }, // Graph name includes match name
      { name: 'Jane Smith Jones', cM: 75 } // Match name includes graph name
    ];

    const result = matchDNA(matches, mockGraph);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      matchedIndividualId: 'I3',
      matchedIndividualName: 'William Shakespeare',
      status: 'Localizado'
    });
    expect(result[1]).toMatchObject({
      matchedIndividualId: 'I2',
      matchedIndividualName: 'Jane Smith',
      status: 'Localizado'
    });
  });

  it('matches fuzzily using Levenshtein distance within threshold', () => {
    // Threshold is Math.max(3, Math.floor(name.length * 0.2))
    const matches: DNAMatch[] = [
      { name: 'Jon Doe', cM: 10 }, // 1 edit from "John Doe"
      { name: 'Jne Smith', cM: 15 }, // 1 edit from "Jane Smith"
      { name: 'Wiliam Shakespear', cM: 20 } // 2 edits from "William Shakespeare"
    ];

    const result = matchDNA(matches, mockGraph);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      matchedIndividualId: 'I1',
      status: 'Localizado'
    });
    expect(result[1]).toMatchObject({
      matchedIndividualId: 'I2',
      status: 'Localizado'
    });
    expect(result[2]).toMatchObject({
      matchedIndividualId: 'I3',
      status: 'Localizado'
    });
  });

  it('does not match if Levenshtein distance exceeds threshold', () => {
    const matches: DNAMatch[] = [
      // normalize("completely different") = "completelydifferent", norm len = 19, threshold = max(3, 3) = 3
      // dist to "johndoe" is > 3
      { name: 'Completely Different', cM: 5 },
      { name: 'XYZ ABC', cM: 5 }
    ];

    const result = matchDNA(matches, mockGraph);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      matchedIndividualId: undefined,
      status: 'Não Localizado'
    });
    expect(result[1]).toMatchObject({
      matchedIndividualId: undefined,
      status: 'Não Localizado'
    });
  });

  it('picks the closest fuzzy match when multiple individuals exist', () => {
    // Add another similar name to graph
    mockGraph.set('I5', {
      individual: { id: 'I5', name: 'John Doc', givenName: 'John', surname: 'Doc' },
      parents: [], children: [], spouses: []
    });

    // "John Do" -> "johndo". "johndoe" (dist 1), "johndoc" (dist 1). Actually let's use a clear winner.
    // Graph has "John Doe" (I1) and "Jane Smith" (I2).
    // Let's add "Jane Smyth"
    mockGraph.set('I6', {
      individual: { id: 'I6', name: 'Jane Smyth', givenName: 'Jane', surname: 'Smyth' },
      parents: [], children: [], spouses: []
    });

    const matches: DNAMatch[] = [
      { name: 'Jane Smythe', cM: 10 }
    ];
    // "janesmythe" vs "janesmith" (dist 2) vs "janesmyth" (dist 1)

    const result = matchDNA(matches, mockGraph);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      matchedIndividualId: 'I6',
      matchedIndividualName: 'Jane Smyth',
      status: 'Localizado'
    });
  });
});
