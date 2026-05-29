import { describe, it, expect } from 'vitest';
import { findMRCA } from './algorithms';
import { GenealogyGraph } from './graph';

describe('findMRCA', () => {
  // Helper to construct a mock graph for testing
  const createMockGraph = (): GenealogyGraph => {
    const graph: GenealogyGraph = new Map();

    const addNode = (id: string, name: string, parents: string[] = []) => {
      graph.set(id, {
        individual: {
          id,
          name,
          givenName: name,
          surname: '',
        },
        parents,
        children: [],
        spouses: [],
      });
    };

    // Construct a simple family tree
    // Great-Grandparent (GG1)
    //   Grandparent (G1)
    //     Parent 1 (P1)
    //       Child 1 (C1)
    //       Child 2 (C2)
    //     Parent 2 (P2)
    //       Child 3 (C3)
    //   Grandparent (G2)
    // Unrelated Person (U1)

    addNode('GG1', 'Great Grandparent');
    addNode('G1', 'Grandparent 1', ['GG1']);
    addNode('G2', 'Grandparent 2', ['GG1']);
    addNode('P1', 'Parent 1', ['G1']);
    addNode('P2', 'Parent 2', ['G1']);
    addNode('C1', 'Child 1', ['P1']);
    addNode('C2', 'Child 2', ['P1']);
    addNode('C3', 'Child 3', ['P2']);
    addNode('U1', 'Unrelated 1');

    return graph;
  };

  it('should handle the exact same node (self)', () => {
    const graph = createMockGraph();
    const result = findMRCA(graph, 'C1', 'C1');

    expect(result).toEqual({
      mrcaId: 'C1',
      mrcaName: 'Child 1',
      path1: ['C1'],
      path2: ['C1'],
    });
  });

  it('should handle when root is a direct ancestor of target', () => {
    const graph = createMockGraph();
    // P1 is an ancestor of C1
    const result = findMRCA(graph, 'P1', 'C1');

    expect(result).toEqual({
      mrcaId: 'P1',
      mrcaName: 'Parent 1',
      path1: ['P1'],
      path2: ['C1', 'P1'], // Target path: C1 -> P1
    });
  });

  it('should handle when target is a direct ancestor of root', () => {
    const graph = createMockGraph();
    // C1 is a descendant of G1 (G1 is ancestor of C1)
    const result = findMRCA(graph, 'C1', 'G1');

    expect(result).toEqual({
      mrcaId: 'G1',
      mrcaName: 'Grandparent 1',
      path1: ['C1', 'P1', 'G1'], // Root path: C1 -> P1 -> G1
      path2: ['G1'],
    });
  });

  it('should find MRCA for siblings', () => {
    const graph = createMockGraph();
    // C1 and C2 are siblings, MRCA is P1
    const result = findMRCA(graph, 'C1', 'C2');

    expect(result).toEqual({
      mrcaId: 'P1',
      mrcaName: 'Parent 1',
      path1: ['C1', 'P1'],
      path2: ['C2', 'P1'],
    });
  });

  it('should find MRCA for first cousins', () => {
    const graph = createMockGraph();
    // C1 and C3 are cousins, MRCA is G1
    const result = findMRCA(graph, 'C1', 'C3');

    expect(result).toEqual({
      mrcaId: 'G1',
      mrcaName: 'Grandparent 1',
      path1: ['C1', 'P1', 'G1'],
      path2: ['C3', 'P2', 'G1'],
    });
  });

  it('should find MRCA for different generations (e.g., uncle/nephew relationship)', () => {
      const graph = createMockGraph();
      // P2 and C1, MRCA is G1
      const result = findMRCA(graph, 'C1', 'P2');

      expect(result).toEqual({
        mrcaId: 'G1',
        mrcaName: 'Grandparent 1',
        path1: ['C1', 'P1', 'G1'],
        path2: ['P2', 'G1'],
      });
  });

  it('should return empty object when there is no common ancestor', () => {
    const graph = createMockGraph();
    // C1 and U1 have no common ancestors
    const result = findMRCA(graph, 'C1', 'U1');

    expect(result).toEqual({});
  });
});
