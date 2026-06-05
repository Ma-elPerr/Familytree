import { describe, it, expect } from 'vitest';
import { findMRCA } from '../algorithms';
import { GenealogyGraph } from '../graph';

describe('findMRCA', () => {
  it('should return the root node when root is target', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [],
      children: [],
      spouses: []
    });

    const result = findMRCA(graph, 'I1', 'I1');

    expect(result).toEqual({
      mrcaId: 'I1',
      mrcaName: 'John Doe',
      path1: ['I1'],
      path2: ['I1']
    });
  });
});
