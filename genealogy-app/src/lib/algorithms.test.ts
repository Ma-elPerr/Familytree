import { describe, it, expect } from 'vitest';
import { processMatches } from './algorithms';
import { GenealogyGraph } from './graph';
import { DNAMatch } from './parsers';

describe('processMatches', () => {
  const mockGraph: GenealogyGraph = new Map([
    [
      'I1',
      {
        individual: { id: 'I1', name: 'Root Person', givenName: 'Root', surname: 'Person' },
        parents: ['I2', 'I3'],
        children: [],
        spouses: []
      }
    ],
    [
      'I2',
      {
        individual: { id: 'I2', name: 'Father Person', givenName: 'Father', surname: 'Person' },
        parents: ['I4', 'I5'],
        children: ['I1'],
        spouses: ['I3']
      }
    ],
    [
      'I3',
      {
        individual: { id: 'I3', name: 'Mother Person', givenName: 'Mother', surname: 'Person' },
        parents: [],
        children: ['I1'],
        spouses: ['I2']
      }
    ],
    [
      'I4',
      {
        individual: { id: 'I4', name: 'Grandfather Person', givenName: 'Grandfather', surname: 'Person' },
        parents: [],
        children: ['I2', 'I6'],
        spouses: ['I5']
      }
    ],
    [
      'I5',
      {
        individual: { id: 'I5', name: 'Grandmother Person', givenName: 'Grandmother', surname: 'Person' },
        parents: [],
        children: ['I2', 'I6'],
        spouses: ['I4']
      }
    ],
    [
      'I6',
      {
        individual: { id: 'I6', name: 'Uncle Person', givenName: 'Uncle', surname: 'Person' },
        parents: ['I4', 'I5'],
        children: ['I7'],
        spouses: []
      }
    ],
    [
      'I7',
      {
        individual: { id: 'I7', name: 'Cousin Person', givenName: 'Cousin', surname: 'Person' },
        parents: ['I6'],
        children: [],
        spouses: []
      }
    ],
    [
      'I8',
      {
        individual: { id: 'I8', name: 'Unrelated Person', givenName: 'Unrelated', surname: 'Person' },
        parents: [],
        children: [],
        spouses: []
      }
    ]
  ]);

  const dnaMatches: DNAMatch[] = [
    { name: 'Cousin Person', cM: 100 },
    { name: 'Unrelated Person', cM: 20 },
    { name: 'Not In Tree Person', cM: 15 },
    { name: 'Root Person', cM: 3500 },
  ];

  it('should process matches without rootNodeId (no MRCA info)', () => {
    const results = processMatches(dnaMatches, mockGraph);

    expect(results).toHaveLength(4);

    const cousinMatch = results.find(r => r.dnaMatch.name === 'Cousin Person');
    expect(cousinMatch).toBeDefined();
    expect(cousinMatch?.matchedIndividualId).toBe('I7');
    expect(cousinMatch?.status).toBe('Localizado');
    expect(cousinMatch?.mrcaId).toBeUndefined();
    expect(cousinMatch?.mrcaName).toBeUndefined();

    const notInTreeMatch = results.find(r => r.dnaMatch.name === 'Not In Tree Person');
    expect(notInTreeMatch).toBeDefined();
    expect(notInTreeMatch?.matchedIndividualId).toBeUndefined();
    expect(notInTreeMatch?.status).toBe('Não Localizado');
  });

  it('should process matches with rootNodeId and find MRCA', () => {
    const results = processMatches(dnaMatches, mockGraph, 'I1');

    expect(results).toHaveLength(4);

    // Cousin Person match
    const cousinMatch = results.find(r => r.dnaMatch.name === 'Cousin Person');
    expect(cousinMatch).toBeDefined();
    expect(cousinMatch?.matchedIndividualId).toBe('I7');
    expect(cousinMatch?.status).toBe('Localizado');
    // I4 or I5 are common ancestors. I4 is added first, so we expect it to be I4
    expect(['I4', 'I5']).toContain(cousinMatch?.mrcaId);
    expect(['Grandfather Person', 'Grandmother Person']).toContain(cousinMatch?.mrcaName);
    expect(cousinMatch?.pathToMrca).toBeDefined();

    // Unrelated Person match
    const unrelatedMatch = results.find(r => r.dnaMatch.name === 'Unrelated Person');
    expect(unrelatedMatch).toBeDefined();
    expect(unrelatedMatch?.matchedIndividualId).toBe('I8');
    expect(unrelatedMatch?.status).toBe('Localizado');
    expect(unrelatedMatch?.mrcaId).toBeUndefined();
    expect(unrelatedMatch?.mrcaName).toBeUndefined();

    // Not In Tree match
    const notInTreeMatch = results.find(r => r.dnaMatch.name === 'Not In Tree Person');
    expect(notInTreeMatch).toBeDefined();
    expect(notInTreeMatch?.matchedIndividualId).toBeUndefined();
    expect(notInTreeMatch?.status).toBe('Não Localizado');
    expect(notInTreeMatch?.mrcaId).toBeUndefined();

    // Root Person match
    const rootMatch = results.find(r => r.dnaMatch.name === 'Root Person');
    expect(rootMatch).toBeDefined();
    expect(rootMatch?.matchedIndividualId).toBe('I1');
    expect(rootMatch?.status).toBe('Localizado');
    expect(rootMatch?.mrcaId).toBe('I1');
    expect(rootMatch?.mrcaName).toBe('Root Person');
    expect(rootMatch?.pathToMrca).toBeDefined();
  });

  it('should handle rootNodeId not found in the graph gracefully', () => {
    const results = processMatches(dnaMatches, mockGraph, 'Unknown_ID');

    expect(results).toHaveLength(4);

    // Everything should just be matched without MRCA, similar to no rootNodeId
    const cousinMatch = results.find(r => r.dnaMatch.name === 'Cousin Person');
    expect(cousinMatch).toBeDefined();
    expect(cousinMatch?.matchedIndividualId).toBe('I7');
    expect(cousinMatch?.status).toBe('Localizado');
    expect(cousinMatch?.mrcaId).toBeUndefined();
    expect(cousinMatch?.mrcaName).toBeUndefined();
  });
});
