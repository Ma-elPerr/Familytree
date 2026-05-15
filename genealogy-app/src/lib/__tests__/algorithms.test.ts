import { describe, it, expect } from 'vitest';
import { GenealogyGraph, GraphNode } from '../graph';
import { processMatches } from '../algorithms';
import { DNAMatch } from '../parsers';

describe('algorithms', () => {
  const graph: GenealogyGraph = new Map();

  graph.set('gp', { individual: { id: 'gp', name: 'Grandparent', givenName: '', surname: '' }, parents: [], children: ['p1', 'p2'], spouses: [] });
  graph.set('p1', { individual: { id: 'p1', name: 'Parent One', givenName: '', surname: '' }, parents: ['gp'], children: ['c1'], spouses: [] });
  graph.set('p2', { individual: { id: 'p2', name: 'Parent Two', givenName: '', surname: '' }, parents: ['gp'], children: ['c2'], spouses: [] });
  graph.set('c1', { individual: { id: 'c1', name: 'Root Child', givenName: '', surname: '' }, parents: ['p1'], children: [], spouses: [] });
  graph.set('c2', { individual: { id: 'c2', name: 'Target Child', givenName: '', surname: '' }, parents: ['p2'], children: [], spouses: [] });

  describe('processMatches', () => {
    it('should correctly process matches without rootNodeId', () => {
      const dnaMatches: DNAMatch[] = [{ name: 'Target Child', cM: 100 }];

      const results = processMatches(dnaMatches, graph);

      expect(results).toHaveLength(1);
      expect(results[0].matchedIndividualId).toBe('c2');
      expect(results[0].mrcaId).toBeUndefined();
      expect(results[0].pathToMrca).toBeUndefined();
    });

    it('should correctly process matches with rootNodeId and graph has rootNodeId', () => {
      const dnaMatches: DNAMatch[] = [{ name: 'Target Child', cM: 100 }];

      const results = processMatches(dnaMatches, graph, 'c1');

      expect(results).toHaveLength(1);
      expect(results[0].matchedIndividualId).toBe('c2');
      expect(results[0].mrcaId).toBe('gp');
      expect(results[0].mrcaName).toBe('Grandparent');
      expect(results[0].pathToMrca).toEqual(['c2', 'p2', 'gp']);
    });

    it('should handle matches with rootNodeId but graph missing rootNodeId', () => {
      const dnaMatches: DNAMatch[] = [{ name: 'Target Child', cM: 100 }];

      const results = processMatches(dnaMatches, graph, 'nonexistent');

      expect(results).toHaveLength(1);
      expect(results[0].matchedIndividualId).toBe('c2');
      expect(results[0].mrcaId).toBeUndefined();
    });

    it('should handle unmatched individuals', () => {
      const dnaMatches: DNAMatch[] = [{ name: 'Unknown Person', cM: 50 }];

      const results = processMatches(dnaMatches, graph, 'c1');

      expect(results).toHaveLength(1);
      expect(results[0].matchedIndividualId).toBeUndefined();
      expect(results[0].mrcaId).toBeUndefined();
      expect(results[0].status).toBe('Não Localizado');
    });
  });
});
