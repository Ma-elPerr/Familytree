import { describe, it, expect, beforeEach } from 'vitest';
import { findDuplicates } from './analysis';
import { GenealogyGraph, GraphNode } from './graph';

describe('findDuplicates', () => {
  let graph: GenealogyGraph;

  beforeEach(() => {
    graph = new Map<string, GraphNode>();
  });

  const createNode = (id: string, name: string, birthYear?: number): GraphNode => ({
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
  });

  it('identifies exact duplicates by name and birth year', () => {
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', 'John Doe', 1900));
    graph.set('I3', createNode('I3', 'Jane Doe', 1905));

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({
      name: 'john doe',
      birthYear: 1900,
      individuals: ['I1', 'I2']
    });
  });

  it('ignores case and whitespace when matching names', () => {
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', ' JOHN DOE ', 1900));
    graph.set('I3', createNode('I3', 'john doe', 1900));

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].individuals).toEqual(['I1', 'I2', 'I3']);
  });

  it('groups individuals with same name and no birth year', () => {
    graph.set('I1', createNode('I1', 'John Doe'));
    graph.set('I2', createNode('I2', 'John Doe'));

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({
      name: 'john doe',
      birthYear: undefined,
      individuals: ['I1', 'I2']
    });
  });

  it('does not group individuals with same name but different birth years', () => {
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', 'John Doe', 1905));
    graph.set('I3', createNode('I3', 'John Doe')); // unknown

    const duplicates = findDuplicates(graph);

    // No groups should have more than 1 individual
    expect(duplicates).toHaveLength(0);
  });

  it('does not group individuals with different names but same birth year', () => {
    graph.set('I1', createNode('I1', 'John Doe', 1900));
    graph.set('I2', createNode('I2', 'Jim Doe', 1900));

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(0);
  });

  it('ignores individuals with no name or "Unknown" name', () => {
    graph.set('I1', createNode('I1', '', 1900));
    graph.set('I2', createNode('I2', '', 1900));
    graph.set('I3', createNode('I3', 'Unknown', 1900));
    graph.set('I4', createNode('I4', 'Unknown', 1900));

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(0);
  });
});
