import { describe, it, expect } from 'vitest';
import { matchDNA } from '../algorithms';
import { GenealogyGraph } from '../graph';
import { DNAMatch } from '../parsers';

describe('matchDNA', () => {
  const createMockGraph = (nodes: { id: string; name: string }[]): GenealogyGraph => {
    const graph: GenealogyGraph = new Map();
    nodes.forEach(node => {
      graph.set(node.id, {
        individual: {
          id: node.id,
          name: node.name,
          givenName: node.name.split(' ')[0] || '',
          surname: node.name.split(' ').slice(1).join(' ') || ''
        },
        parents: [],
        children: [],
        spouses: []
      });
    });
    return graph;
  };

  it('should find an exact name match', () => {
    const graph = createMockGraph([
      { id: 'I1', name: 'John Doe' },
      { id: 'I2', name: 'Jane Smith' }
    ]);
    const dnaMatches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].matchedIndividualName).toBe('John Doe');
  });

  it('should find a substring match (match name inside graph name)', () => {
    const graph = createMockGraph([
      { id: 'I1', name: 'John Doe' }
    ]);
    const dnaMatches: DNAMatch[] = [{ name: 'John', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
  });

  it('should find a substring match (graph name inside match name)', () => {
    const graph = createMockGraph([
      { id: 'I1', name: 'John' }
    ]);
    const dnaMatches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
  });

  it('should find a fuzzy match (levenshtein distance)', () => {
    const graph = createMockGraph([
      { id: 'I1', name: 'Jonathon Doe' }
    ]);
    // 'Jonathan' vs 'Jonathon' (1 typo)
    const dnaMatches: DNAMatch[] = [{ name: 'Jonathan Doe', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
  });

  it('should return "Não Localizado" when distance exceeds threshold', () => {
    const graph = createMockGraph([
      { id: 'I1', name: 'John Doe' }
    ]);
    // 'Alexander' vs 'John' (distance is large)
    const dnaMatches: DNAMatch[] = [{ name: 'Alexander', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Não Localizado');
    expect(results[0].matchedIndividualId).toBeUndefined();
  });

  it('should prioritize exact match over fuzzy match', () => {
    const graph = createMockGraph([
      { id: 'I1', name: 'Jonathan Doe' },
      { id: 'I2', name: 'Jonathon Doe' }
    ]);
    const dnaMatches: DNAMatch[] = [{ name: 'Jonathan Doe', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1'); // I1 is an exact match
  });

  it('should normalize names by ignoring case and special characters', () => {
    const graph = createMockGraph([
      { id: 'I1', name: 'Dr. John-Doe, Jr.' }
    ]);
    const dnaMatches: DNAMatch[] = [{ name: 'dr john doe jr', cM: 100 }];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
  });
});
