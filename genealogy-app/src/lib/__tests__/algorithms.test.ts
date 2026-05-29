import { describe, it, expect, beforeEach } from 'vitest';
import { processMatches } from '../algorithms';
import { GenealogyGraph, buildGraph } from '../graph';
import { DNAMatch, GedcomData } from '../parsers';

describe('algorithms', () => {
  describe('processMatches', () => {
    let graph: GenealogyGraph;

    beforeEach(() => {
      // Create a simple genealogy graph
      const data: GedcomData = {
        individuals: new Map([
          ['@I1@', { id: '@I1@', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
          ['@I2@', { id: '@I2@', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }],
          ['@I3@', { id: '@I3@', name: 'Parent Doe', givenName: 'Parent', surname: 'Doe' }],
        ]),
        families: new Map([
          ['@F1@', { id: '@F1@', husband: '@I3@', children: ['@I1@', '@I2@'] }]
        ])
      };
      graph = buildGraph(data);
    });

    it('should process DNA matches and find MRCA', () => {
      const dnaMatches: DNAMatch[] = [
        { name: 'Jane Doe', cM: 3500 } // Match with Jane Doe
      ];

      // Root node is John Doe (@I1@)
      const results = processMatches(dnaMatches, graph, '@I1@');

      expect(results).toHaveLength(1);
      expect(results[0].matchedIndividualId).toBe('@I2@');
      expect(results[0].status).toBe('Localizado');

      // MRCA of John and Jane is Parent (@I3@)
      expect(results[0].mrcaId).toBe('@I3@');
      expect(results[0].mrcaName).toBe('Parent Doe');

      // Path from Jane to MRCA
      expect(results[0].pathToMrca).toEqual(['@I2@', '@I3@']);
    });

    it('should return matched DNA results without MRCA info if rootNodeId is not provided', () => {
        const dnaMatches: DNAMatch[] = [
          { name: 'Jane Doe', cM: 3500 }
        ];

        const results = processMatches(dnaMatches, graph);

        expect(results).toHaveLength(1);
        expect(results[0].matchedIndividualId).toBe('@I2@');
        expect(results[0].mrcaId).toBeUndefined();
    });

    it('should return matched DNA results without MRCA info if rootNodeId is not in the graph', () => {
        const dnaMatches: DNAMatch[] = [
          { name: 'Jane Doe', cM: 3500 }
        ];

        const results = processMatches(dnaMatches, graph, '@UNKNOWN@');

        expect(results).toHaveLength(1);
        expect(results[0].matchedIndividualId).toBe('@I2@');
        expect(results[0].mrcaId).toBeUndefined();
    });

    it('should handle cases where match is not found in graph', () => {
        const dnaMatches: DNAMatch[] = [
          { name: 'Unknown Person', cM: 100 }
        ];

        const results = processMatches(dnaMatches, graph, '@I1@');

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('Não Localizado');
        expect(results[0].matchedIndividualId).toBeUndefined();
        expect(results[0].mrcaId).toBeUndefined();
    });

    it('should handle cases where match is found but MRCA is not found', () => {
        // Create an isolated node
        const data: GedcomData = {
          individuals: new Map([
            ['@I1@', { id: '@I1@', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
            ['@I2@', { id: '@I2@', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }],
          ]),
          families: new Map()
        };
        const localGraph = buildGraph(data);

        const dnaMatches: DNAMatch[] = [
          { name: 'Jane Doe', cM: 100 }
        ];

        const results = processMatches(dnaMatches, localGraph, '@I1@');

        expect(results).toHaveLength(1);
        expect(results[0].matchedIndividualId).toBe('@I2@');
        expect(results[0].mrcaId).toBeUndefined();
        expect(results[0].pathToMrca).toBeUndefined();
    });
  });
});
