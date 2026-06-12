import { describe, it, expect } from 'vitest';
import { matchDNA } from '../algorithms';
import { GenealogyGraph, GraphNode } from '../graph';
import { DNAMatch } from '../parsers';

describe('matchDNA', () => {
  it('should find an exact match', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    } as GraphNode);

    const dnaMatches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].matchedIndividualName).toBe('John Doe');
  });

  it('should find a fuzzy match (Levenshtein distance)', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'Christopher', givenName: 'Christopher', surname: '' },
      parents: [], children: [], spouses: []
    } as GraphNode);

    // "Christofer" has Levenshtein distance 1 to "Christopher"
    const dnaMatches: DNAMatch[] = [{ name: 'Christofer', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].matchedIndividualName).toBe('Christopher');
  });

  it('should not match if distance is too high', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John', givenName: 'John', surname: '' },
      parents: [], children: [], spouses: []
    } as GraphNode);

    const dnaMatches: DNAMatch[] = [{ name: 'Elizabeth', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Não Localizado');
    expect(results[0].matchedIndividualId).toBeUndefined();
  });

  it('should match if name is included', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    } as GraphNode);

    const dnaMatches: DNAMatch[] = [{ name: 'John', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
  });

  it('should handle empty DNA matches', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    } as GraphNode);

    const dnaMatches: DNAMatch[] = [];

    const results = matchDNA(dnaMatches, graph);
    expect(results).toHaveLength(0);
  });
});
