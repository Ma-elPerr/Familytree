import { describe, it, expect } from 'vitest';
import { findDuplicates } from './analysis';
import { GenealogyGraph, GraphNode } from './graph';

describe('findDuplicates', () => {
  const createGraph = (nodes: { id: string; name: string; birthYear?: number }[]): GenealogyGraph => {
    const graph = new Map<string, GraphNode>();
    for (const node of nodes) {
      graph.set(node.id, {
        individual: {
          id: node.id,
          name: node.name,
          givenName: '',
          surname: '',
          birthYear: node.birthYear,
        },
        parents: [],
        children: [],
        spouses: [],
      });
    }
    return graph;
  };

  it('detects duplicates with identical name and birth year', () => {
    const graph = createGraph([
      { id: '1', name: 'John Doe', birthYear: 1900 },
      { id: '2', name: 'John Doe', birthYear: 1900 },
      { id: '3', name: 'Jane Doe', birthYear: 1902 },
    ]);

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({
      name: 'john doe',
      birthYear: 1900,
      individuals: ['1', '2'],
    });
  });

  it('detects duplicates ignoring case and whitespace in the name', () => {
    const graph = createGraph([
      { id: '1', name: 'John Doe', birthYear: 1900 },
      { id: '2', name: ' john DOE ', birthYear: 1900 },
    ]);

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({
      name: 'john doe',
      birthYear: 1900,
      individuals: ['1', '2'],
    });
  });

  it('detects duplicates when the birth year is undefined/unknown', () => {
    const graph = createGraph([
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'John Doe' },
    ]);

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({
      name: 'john doe',
      birthYear: undefined,
      individuals: ['1', '2'],
    });
  });

  it('does not flag individuals with the same name but different birth years', () => {
    const graph = createGraph([
      { id: '1', name: 'John Doe', birthYear: 1900 },
      { id: '2', name: 'John Doe', birthYear: 1920 },
    ]);

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(0);
  });

  it('ignores individuals with missing names or the name "Unknown"', () => {
    const graph = createGraph([
      { id: '1', name: 'Unknown', birthYear: 1900 },
      { id: '2', name: 'Unknown', birthYear: 1900 },
      { id: '3', name: '', birthYear: 1900 },
      { id: '4', name: '', birthYear: 1900 },
    ]);

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(0);
  });
});
