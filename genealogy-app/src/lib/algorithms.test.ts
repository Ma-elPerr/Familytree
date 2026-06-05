import { describe, it, expect, beforeEach } from 'vitest';
import { matchDNA, findMRCA, processMatches } from './algorithms';
import { GenealogyGraph, GraphNode } from './graph';
import { DNAMatch } from './parsers';

describe('algorithms', () => {
  let graph: GenealogyGraph;

  beforeEach(() => {
    graph = new Map<string, GraphNode>();

    // Helper to add nodes
    const addNode = (id: string, name: string, parents: string[] = []) => {
      graph.set(id, {
        individual: { id, name, givenName: name.split(' ')[0], surname: name.split(' ')[1] || '' },
        parents,
        children: [],
        spouses: []
      });
    };

    // Create a small tree:
    //      P1       P2
    //       \       /
    //          C1       P3
    //           \       /
    //              GC1
    //
    addNode('P1', 'John Doe');
    addNode('P2', 'Jane Smith');
    addNode('C1', 'Jim Doe', ['P1', 'P2']);
    addNode('P3', 'Mary Johnson');
    addNode('GC1', 'Jack Doe', ['C1', 'P3']);

    // Add another disconnected family
    addNode('D1', 'Disconnected Person');
  });

  describe('matchDNA', () => {
    it('should find exact matches', () => {
      const matches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];
      const result = matchDNA(matches, graph);
      expect(result).toHaveLength(1);
      expect(result[0].matchedIndividualId).toBe('P1');
      expect(result[0].status).toBe('Localizado');
    });

    it('should find case-insensitive and trimmed matches', () => {
      const matches: DNAMatch[] = [{ name: '  jOHn DOe  ', cM: 100 }];
      const result = matchDNA(matches, graph);
      expect(result[0].matchedIndividualId).toBe('P1');
      expect(result[0].status).toBe('Localizado');
    });

    it('should find partial matches', () => {
      const matches: DNAMatch[] = [{ name: 'Doe', cM: 100 }];
      const result = matchDNA(matches, graph);
      // It might match John Doe, Jim Doe or Jack Doe. Let's just check it found someone.
      expect(result[0].status).toBe('Localizado');
      expect(['P1', 'C1', 'GC1']).toContain(result[0].matchedIndividualId);
    });

    it('should find fuzzy matches within threshold', () => {
      const matches: DNAMatch[] = [{ name: 'John Do', cM: 100 }]; // 1 typo
      const result = matchDNA(matches, graph);
      expect(result[0].matchedIndividualId).toBe('P1');
      expect(result[0].status).toBe('Localizado');
    });

    it('should not match when names are completely different', () => {
      const matches: DNAMatch[] = [{ name: 'XYZ ABC', cM: 100 }];
      const result = matchDNA(matches, graph);
      expect(result[0].matchedIndividualId).toBeUndefined();
      expect(result[0].status).toBe('Não Localizado');
    });
  });

  describe('findMRCA', () => {
    it('should return node itself when root and target are the same', () => {
      const result = findMRCA(graph, 'P1', 'P1');
      expect(result.mrcaId).toBe('P1');
      expect(result.path1).toEqual(['P1']);
      expect(result.path2).toEqual(['P1']);
    });

    it('should return root as MRCA when root is ancestor of target', () => {
      const result = findMRCA(graph, 'P1', 'GC1');
      expect(result.mrcaId).toBe('P1');
      expect(result.path1).toEqual(['P1']);
      expect(result.path2).toContain('P1'); // The path up from GC1 should end at P1
    });

    it('should return target as MRCA when target is ancestor of root', () => {
      const result = findMRCA(graph, 'GC1', 'P1');
      expect(result.mrcaId).toBe('P1');
      expect(result.path1).toContain('P1'); // Path up from GC1
      expect(result.path2).toEqual(['P1']);
    });

    it('should find common ancestor for two descendants', () => {
      // Let's add a sibling to C1
      graph.set('C2', {
        individual: { id: 'C2', name: 'Joan Doe', givenName: 'Joan', surname: 'Doe' },
        parents: ['P1', 'P2'],
        children: [],
        spouses: []
      });
      // And a child to C2
      graph.set('GC2', {
        individual: { id: 'GC2', name: 'Jill Doe', givenName: 'Jill', surname: 'Doe' },
        parents: ['C2'],
        children: [],
        spouses: []
      });

      // GC1 and GC2 share P1 and P2 as ancestors.
      // The queue order will determine which one is found first (likely P1).
      const result = findMRCA(graph, 'GC1', 'GC2');
      expect(['P1', 'P2']).toContain(result.mrcaId);
      expect(result.path1).toContain(result.mrcaId);
      expect(result.path2).toContain(result.mrcaId);
    });

    it('should return empty object if no MRCA exists', () => {
      const result = findMRCA(graph, 'P1', 'D1');
      expect(result.mrcaId).toBeUndefined();
    });
  });

  describe('processMatches', () => {
    it('should match DNA and find MRCA if root is provided', () => {
      const matches: DNAMatch[] = [{ name: 'Jane Smith', cM: 100 }];
      const results = processMatches(matches, graph, 'GC1');

      expect(results).toHaveLength(1);
      const match = results[0];

      expect(match.matchedIndividualId).toBe('P2');
      expect(match.mrcaId).toBe('P2'); // P2 is the ancestor of GC1
      expect(match.pathToMrca).toBeDefined(); // Path from Jane Smith to Jane Smith is just Jane Smith
    });

    it('should only match DNA if root is not provided', () => {
      const matches: DNAMatch[] = [{ name: 'Jane Smith', cM: 100 }];
      const results = processMatches(matches, graph);

      expect(results).toHaveLength(1);
      const match = results[0];

      expect(match.matchedIndividualId).toBe('P2');
      expect(match.mrcaId).toBeUndefined();
      expect(match.pathToMrca).toBeUndefined();
    });
  });
});
