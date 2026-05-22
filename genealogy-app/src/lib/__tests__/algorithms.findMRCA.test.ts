import { describe, it, expect } from 'vitest';
import { findMRCA } from '../algorithms';
import { GenealogyGraph, GraphNode } from '../graph';

describe('findMRCA', () => {
  function createNode(id: string, name: string, parents: string[] = []): GraphNode {
    return {
      individual: {
        id,
        name,
        givenName: name,
        surname: '',
      },
      parents,
      children: [],
      spouses: []
    };
  }

  function createGraph(nodes: GraphNode[]): GenealogyGraph {
    const graph = new Map<string, GraphNode>();
    nodes.forEach(node => graph.set(node.individual.id, node));
    return graph;
  }

  it('returns correctly when root is the same as the target', () => {
    const graph = createGraph([
      createNode('1', 'Self')
    ]);
    const result = findMRCA(graph, '1', '1');
    expect(result).toEqual({
      mrcaId: '1',
      mrcaName: 'Self',
      path1: ['1'],
      path2: ['1']
    });
  });

  it('returns correctly when root is an ancestor of target', () => {
    // Target -> Parent -> Root
    const graph = createGraph([
      createNode('R', 'Root Node'),
      createNode('P', 'Parent', ['R']),
      createNode('T', 'Target', ['P'])
    ]);
    const result = findMRCA(graph, 'R', 'T');

    // According to logic, targetAncestors has R.
    // path1 = [R], path2 = path from target to R = [T, P, R]
    expect(result).toEqual({
      mrcaId: 'R',
      mrcaName: 'Root Node',
      path1: ['R'],
      path2: ['T', 'P', 'R']
    });
  });

  it('returns correctly when target is an ancestor of root', () => {
    // Root -> Parent -> Target
    const graph = createGraph([
      createNode('T', 'Target Node'),
      createNode('P', 'Parent', ['T']),
      createNode('R', 'Root', ['P'])
    ]);
    const result = findMRCA(graph, 'R', 'T');

    // According to logic, rootAncestors has T.
    // path1 = path from root to T = [R, P, T], path2 = [T]
    expect(result).toEqual({
      mrcaId: 'T',
      mrcaName: 'Target Node',
      path1: ['R', 'P', 'T'],
      path2: ['T']
    });
  });

  it('finds the MRCA when both nodes share an ancestor', () => {
    // R -> P1 -> A
    // T -> P2 -> A
    const graph = createGraph([
      createNode('A', 'Ancestor'),
      createNode('P1', 'Parent 1', ['A']),
      createNode('P2', 'Parent 2', ['A']),
      createNode('R', 'Root', ['P1']),
      createNode('T', 'Target', ['P2'])
    ]);
    const result = findMRCA(graph, 'R', 'T');

    expect(result).toEqual({
      mrcaId: 'A',
      mrcaName: 'Ancestor',
      path1: ['R', 'P1', 'A'],
      path2: ['T', 'P2', 'A']
    });
  });

  it('returns empty object when no common ancestor exists', () => {
    // R -> P1
    // T -> P2
    const graph = createGraph([
      createNode('P1', 'Parent 1'),
      createNode('P2', 'Parent 2'),
      createNode('R', 'Root', ['P1']),
      createNode('T', 'Target', ['P2'])
    ]);
    const result = findMRCA(graph, 'R', 'T');

    expect(result).toEqual({});
  });

  it('finds the closest MRCA when nodes have multiple common ancestors', () => {
    // R -> P -> A1 -> A2
    // T -> P -> A1 -> A2
    // Closest MRCA should be P.
    const graph = createGraph([
      createNode('A2', 'Ancestor 2'),
      createNode('A1', 'Ancestor 1', ['A2']),
      createNode('P', 'Parent', ['A1']),
      createNode('R', 'Root', ['P']),
      createNode('T', 'Target', ['P'])
    ]);
    const result = findMRCA(graph, 'R', 'T');

    expect(result).toEqual({
      mrcaId: 'P',
      mrcaName: 'Parent',
      path1: ['R', 'P'],
      path2: ['T', 'P']
    });
  });

  it('finds closest MRCA with asymmetrical distance', () => {
    // R -> A
    // T -> P2 -> A
    // Closest MRCA should be A.
    const graph = createGraph([
      createNode('A', 'Ancestor'),
      createNode('P2', 'Parent 2', ['A']),
      createNode('R', 'Root', ['A']),
      createNode('T', 'Target', ['P2'])
    ]);
    const result = findMRCA(graph, 'R', 'T');

    expect(result).toEqual({
      mrcaId: 'A',
      mrcaName: 'Ancestor',
      path1: ['R', 'A'],
      path2: ['T', 'P2', 'A']
    });
  });
});
