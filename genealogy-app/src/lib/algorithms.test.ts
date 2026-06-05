import { expect, test, describe } from 'vitest';
import { matchDNA } from './algorithms';
import { GenealogyGraph, GraphNode } from './graph';
import { DNAMatch } from './parsers';

describe('matchDNA', () => {
  const createNode = (id: string, name: string): GraphNode => ({
    individual: {
      id,
      name,
      givenName: name.split(' ')[0] || '',
      surname: name.split(' ')[1] || '',
    },
    parents: [],
    children: [],
    spouses: []
  });

  const setupGraph = (nodes: { id: string, name: string }[]): GenealogyGraph => {
    const graph = new Map<string, GraphNode>();
    for (const n of nodes) {
      graph.set(n.id, createNode(n.id, n.name));
    }
    return graph;
  };

  test('Scenario 1: Exact match', () => {
    const graph = setupGraph([{ id: '1', name: 'John Doe' }]);
    const matches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];
    const result = matchDNA(matches, graph);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('1');
    expect(result[0].matchedIndividualName).toBe('John Doe');
  });

  test('Scenario 2: Case-insensitive match with special characters', () => {
    // Both will be normalized.
    // 'JOHN DOE!' becomes 'john doe', which exactly matches 'john doe'
    const graph = setupGraph([{ id: '2', name: 'john doe' }]);
    const matches: DNAMatch[] = [{ name: 'JOHN DOE!', cM: 100 }];
    const result = matchDNA(matches, graph);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('2');
  });

  test('Scenario 3: Substring match', () => {
    const graph = setupGraph([{ id: '3', name: 'John Doe' }]);
    const matches: DNAMatch[] = [{ name: 'John', cM: 100 }];
    const result = matchDNA(matches, graph);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('3');
  });

  test('Scenario 4: Fuzzy match (Levenshtein distance) below threshold', () => {
    const graph = setupGraph([{ id: '4', name: 'John Doe' }]);
    // 'Jonh' instead of 'John'
    const matches: DNAMatch[] = [{ name: 'Jonh Doe', cM: 100 }];
    const result = matchDNA(matches, graph);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Localizado');
    expect(result[0].matchedIndividualId).toBe('4');
  });

  test('Scenario 5: No match (distance exceeds threshold)', () => {
    const graph = setupGraph([{ id: '5', name: 'Bob Smith' }]);
    const matches: DNAMatch[] = [{ name: 'Alice', cM: 100 }];
    const result = matchDNA(matches, graph);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Não Localizado');
    expect(result[0].matchedIndividualId).toBeUndefined();
  });
});
