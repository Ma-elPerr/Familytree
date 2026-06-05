import { describe, it, expect, beforeEach } from 'vitest';
import { findMRCA } from './algorithms';
import { GenealogyGraph, GraphNode } from './graph';

describe('findMRCA', () => {
  let graph: GenealogyGraph;

  const createNode = (id: string, parents: string[] = []): GraphNode => ({
    individual: {
      id,
      name: `Person ${id}`,
      givenName: 'Person',
      surname: id,
    },
    parents,
    children: [], // We only need parents for getAncestors
    spouses: []
  });

  beforeEach(() => {
    graph = new Map<string, GraphNode>();
  });

  it('should return the node itself when root and target are the same', () => {
    graph.set('A', createNode('A'));

    const result = findMRCA(graph, 'A', 'A');
    expect(result).toEqual({
      mrcaId: 'A',
      mrcaName: 'Person A',
      path1: ['A'],
      path2: ['A']
    });
  });

  it('should return root as MRCA when root is an ancestor of target', () => {
    // A -> B -> C
    graph.set('A', createNode('A'));
    graph.set('B', createNode('B', ['A']));
    graph.set('C', createNode('C', ['B']));

    const result = findMRCA(graph, 'A', 'C');
    expect(result).toEqual({
      mrcaId: 'A',
      mrcaName: 'Person A',
      path1: ['A'],
      path2: ['C', 'B', 'A']
    });
  });

  it('should return target as MRCA when target is an ancestor of root', () => {
    // A -> B -> C
    graph.set('A', createNode('A'));
    graph.set('B', createNode('B', ['A']));
    graph.set('C', createNode('C', ['B']));

    const result = findMRCA(graph, 'C', 'A');
    expect(result).toEqual({
      mrcaId: 'A',
      mrcaName: 'Person A',
      path1: ['C', 'B', 'A'],
      path2: ['A']
    });
  });

  it('should find common ancestor when root and target are siblings', () => {
    //   A
    //  / \
    // B   C
    graph.set('A', createNode('A'));
    graph.set('B', createNode('B', ['A']));
    graph.set('C', createNode('C', ['A']));

    const result = findMRCA(graph, 'B', 'C');
    expect(result).toEqual({
      mrcaId: 'A',
      mrcaName: 'Person A',
      path1: ['B', 'A'],
      path2: ['C', 'A']
    });
  });

  it('should find closest common ancestor (lowest total distance)', () => {
    //     A
    //     |
    //     B (common ancestor to D and E, closer than A)
    //    / \
    //   C   D
    //  /
    // E
    graph.set('A', createNode('A'));
    graph.set('B', createNode('B', ['A']));
    graph.set('C', createNode('C', ['B']));
    graph.set('D', createNode('D', ['B']));
    graph.set('E', createNode('E', ['C']));

    const result = findMRCA(graph, 'E', 'D');
    expect(result).toEqual({
      mrcaId: 'B',
      mrcaName: 'Person B',
      path1: ['E', 'C', 'B'],
      path2: ['D', 'B']
    });
  });

  it('should return empty object when there is no common ancestor', () => {
    // A -> B
    // C -> D
    graph.set('A', createNode('A'));
    graph.set('B', createNode('B', ['A']));
    graph.set('C', createNode('C'));
    graph.set('D', createNode('D', ['C']));

    const result = findMRCA(graph, 'B', 'D');
    expect(result).toEqual({});
  });
});
