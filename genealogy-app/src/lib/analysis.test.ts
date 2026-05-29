import { describe, it, expect } from 'vitest';
import { findDuplicates } from './analysis';
import { GenealogyGraph, GraphNode } from './graph';

function createNode(id: string, name: string, birthYear?: number): GraphNode {
  return {
    individual: {
      id,
      name,
      givenName: name.split(' ')[0] || '',
      surname: name.split(' ')[1] || '',
      birthYear
    },
    parents: [],
    children: [],
    spouses: []
  };
}

describe('findDuplicates', () => {
  it('should return empty array for an empty graph', () => {
    const graph: GenealogyGraph = new Map();
    expect(findDuplicates(graph)).toEqual([]);
  });

  it('should return empty array when all individuals are unique', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', 'Jane Smith', 1905));
    graph.set('I3', createNode('I3', 'John Doe', 1901)); // different year
    expect(findDuplicates(graph)).toEqual([]);
  });

  it('should detect exact duplicate individuals', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', 'John Doe', 1900));
    const result = findDuplicates(graph);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'john doe',
      birthYear: 1900,
      individuals: ['I1', 'I2']
    });
  });

  it('should detect duplicates case-insensitively and ignoring whitespace', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', ' JOHN doe  ', 1900));
    const result = findDuplicates(graph);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'john doe',
      birthYear: 1900,
      individuals: ['I1', 'I2']
    });
  });

  it('should detect duplicates when birth year is undefined', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createNode('I1', 'John Doe', undefined));
    graph.set('I2', createNode('I2', 'John Doe', undefined));
    const result = findDuplicates(graph);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'john doe',
      birthYear: undefined,
      individuals: ['I1', 'I2']
    });
  });

  it('should ignore missing or Unknown names', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createNode('I1', 'Unknown', 1900));
    graph.set('I2', createNode('I2', 'Unknown', 1900));
    graph.set('I3', createNode('I3', '', 1900));
    graph.set('I4', createNode('I4', '', 1900));
    const result = findDuplicates(graph);
    expect(result).toEqual([]);
  });

  it('should group multiple duplicates correctly', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', 'John Doe', 1900));
    graph.set('I3', createNode('I3', 'John Doe', 1900));
    graph.set('I4', createNode('I4', 'Jane Doe', 1905));
    graph.set('I5', createNode('I5', 'Jane Doe', 1905));

    const result = findDuplicates(graph);
    expect(result).toHaveLength(2);

    // Sort results to make test deterministic
    const sortedResult = result.sort((a, b) => a.name.localeCompare(b.name));

    expect(sortedResult[0]).toEqual({
      name: 'jane doe',
      birthYear: 1905,
      individuals: ['I4', 'I5']
    });

    expect(sortedResult[1]).toEqual({
      name: 'john doe',
      birthYear: 1900,
      individuals: ['I1', 'I2', 'I3']
    });
  });
});
