import { describe, it, expect } from 'vitest';
import { matchDNA } from '../algorithms';
import { GenealogyGraph, GraphNode } from '../graph';
import { DNAMatch } from '../parsers';

describe('matchDNA', () => {
  const createMockGraph = (): GenealogyGraph => {
    const graph = new Map<string, GraphNode>();

    // Add individuals to the mock graph
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    });
    graph.set('I2', {
      individual: { id: 'I2', name: 'Jane Smith', givenName: 'Jane', surname: 'Smith' },
      parents: [], children: [], spouses: []
    });
    graph.set('I3', {
      individual: { id: 'I3', name: 'Robert Johnson', givenName: 'Robert', surname: 'Johnson' },
      parents: [], children: [], spouses: []
    });
    graph.set('I4', {
      individual: { id: 'I4', name: 'William Shakespeare', givenName: 'William', surname: 'Shakespeare' },
      parents: [], children: [], spouses: []
    });

    return graph;
  };

  const graph = createMockGraph();

  it('finds an exact match', () => {
    const matches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];
    const result = matchDNA(matches, graph);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I1');
    expect(result[0].matchedIndividualName).toBe('John Doe');
  });

  it('finds a partial match (graph name includes match name)', () => {
    const matches: DNAMatch[] = [{ name: 'John', cM: 50 }];
    const result = matchDNA(matches, graph);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I1');
  });

  it('finds a partial match (match name includes graph name)', () => {
    const matches: DNAMatch[] = [{ name: 'Jane Smith Williams', cM: 50 }];
    const result = matchDNA(matches, graph);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I2');
  });

  it('finds a fuzzy match with a small typo within threshold', () => {
    // threshold = max(3, floor("robert jonhson".length * 0.2)) = max(3, floor(14 * 0.2)) = 3
    const matches: DNAMatch[] = [{ name: 'Robert Jonhson', cM: 50 }]; // Distance is 2 (h and n swapped)
    const result = matchDNA(matches, graph);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I3');
  });

  it('returns Não Localizado for a completely different name', () => {
    const matches: DNAMatch[] = [{ name: 'Michael Jackson', cM: 50 }];
    const result = matchDNA(matches, graph);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Não Localizado');
    expect(result[0].matchedIndividualId).toBeUndefined();
  });

  it('handles multiple DNA matches', () => {
    const matches: DNAMatch[] = [
      { name: 'John Doe', cM: 100 },
      { name: 'Unknown Person', cM: 50 }
    ];
    const result = matchDNA(matches, graph);

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I1');
    expect(result[1].status).toBe('Não Localizado');
    expect(result[1].matchedIndividualId).toBeUndefined();
  });

  it('normalizes names appropriately before matching', () => {
    // Should match "Jane Smith" after lowercase, removing non-alphanumeric, and trim
    const matches: DNAMatch[] = [{ name: '  JANE-SMITH!  ', cM: 50 }];
    const result = matchDNA(matches, graph);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('I2');
  });
});
