import { expect, test, describe } from 'vitest';
import { findMRCA } from './algorithms';
import { GenealogyGraph, GraphNode } from './graph';

describe('findMRCA', () => {
  test('returns self-match when rootNodeId and targetNodeId are the same', () => {
    const graph: GenealogyGraph = new Map();
    const mockNode: GraphNode = {
      individual: {
        id: 'I1',
        name: 'John Doe',
        givenName: 'John',
        surname: 'Doe'
      },
      parents: [],
      children: [],
      spouses: []
    };
    graph.set('I1', mockNode);

    const result = findMRCA(graph, 'I1', 'I1');

    expect(result).toEqual({
      mrcaId: 'I1',
      mrcaName: 'John Doe',
      path1: ['I1'],
      path2: ['I1']
    });
  });
});
