import { describe, it, expect } from 'vitest';
import { matchDNA } from './algorithms';
import { GenealogyGraph } from './graph';

describe('matchDNA edge cases', () => {
  it('should find exact match', () => {
    const graph = new Map() as GenealogyGraph;
    graph.set('I1', { individual: { id: 'I1', name: 'John Doe' }, parents: [], children: [], spouses: [] });

    const dnaMatches = [{ name: 'John Doe', cM: 100 }];
    const result = matchDNA(dnaMatches, graph);

    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I1');
  });

  it('should not incorrectly match empty strings', () => {
    const graph = new Map() as GenealogyGraph;
    graph.set('I1', { individual: { id: 'I1', name: 'John Doe' }, parents: [], children: [], spouses: [] });

    // Empty string shouldn't match anything.
    // The previous implementation of includes('') is true for any string.
    const dnaMatches = [{ name: '', cM: 100 }];
    const result = matchDNA(dnaMatches, graph);

    expect(result[0].status).toBe('Não Localizado');
  });

  it('should not incorrectly match names that normalize to empty string', () => {
    const graph = new Map() as GenealogyGraph;
    graph.set('I1', { individual: { id: 'I1', name: 'John Doe' }, parents: [], children: [], spouses: [] });

    // "!!!" normalizes to "" which includes('') is true
    const dnaMatches = [{ name: '!!!', cM: 100 }];
    const result = matchDNA(dnaMatches, graph);

    expect(result[0].status).toBe('Não Localizado');
  });

  it('should correctly match when one name is a substring of the other', () => {
    const graph = new Map() as GenealogyGraph;
    graph.set('I1', { individual: { id: 'I1', name: 'Johnathon Doe' }, parents: [], children: [], spouses: [] });

    const dnaMatches = [{ name: 'Johnathon', cM: 100 }];
    const result = matchDNA(dnaMatches, graph);

    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I1');
  });

  it('should correctly match when graph node has empty or missing name', () => {
    const graph = new Map() as GenealogyGraph;
    graph.set('I1', { individual: { id: 'I1', name: '' }, parents: [], children: [], spouses: [] });
    graph.set('I2', { individual: { id: 'I2', name: 'Valid Name' }, parents: [], children: [], spouses: [] });

    const dnaMatches = [{ name: 'Valid Name', cM: 100 }];
    const result = matchDNA(dnaMatches, graph);

    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I2');
  });
});
