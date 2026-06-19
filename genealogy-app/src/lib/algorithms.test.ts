import { describe, it, expect } from 'vitest';
import { getAncestors } from './algorithms';
import { GenealogyGraph, GraphNode } from './graph';

function createMockNode(id: string, name: string, parents: string[] = []): GraphNode {
  return {
    individual: {
      id,
      name,
      givenName: name.split(' ')[0] || '',
      surname: name.split(' ')[1] || '',
    },
    parents,
    children: [],
    spouses: []
  };
}

describe('getAncestors', () => {
  it('should return an empty map for a node with no parents', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createMockNode('I1', 'John Doe'));

    const ancestors = getAncestors(graph, 'I1');

    expect(ancestors.size).toBe(0);
  });

  it('should return paths to all ancestors for multiple generations', () => {
    const graph: GenealogyGraph = new Map();

    // Create a 3-generation family
    // I1 (child) -> I2 (father), I3 (mother)
    // I2 (father) -> I4 (grandfather), I5 (grandmother)
    graph.set('I1', createMockNode('I1', 'Child', ['I2', 'I3']));
    graph.set('I2', createMockNode('I2', 'Father', ['I4', 'I5']));
    graph.set('I3', createMockNode('I3', 'Mother'));
    graph.set('I4', createMockNode('I4', 'Grandfather'));
    graph.set('I5', createMockNode('I5', 'Grandmother'));

    const ancestors = getAncestors(graph, 'I1');

    // Expected paths from I1 to ancestors:
    // I1 -> I2 (father)
    // I1 -> I3 (mother)
    // I1 -> I2 -> I4 (grandfather)
    // I1 -> I2 -> I5 (grandmother)

    expect(ancestors.size).toBe(4);

    expect(ancestors.get('I2')).toEqual(['I1', 'I2']);
    expect(ancestors.get('I3')).toEqual(['I1', 'I3']);
    expect(ancestors.get('I4')).toEqual(['I1', 'I2', 'I4']);
    expect(ancestors.get('I5')).toEqual(['I1', 'I2', 'I5']);
  });

  it('should handle edge case when start node is not in the graph', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createMockNode('I1', 'John Doe'));

    const ancestors = getAncestors(graph, 'MissingNode');

    expect(ancestors.size).toBe(0);
  });

  it('should handle missing parent nodes gracefully', () => {
    const graph: GenealogyGraph = new Map();
    // I1 has parent I2, but I2 is not in the graph
    graph.set('I1', createMockNode('I1', 'Child', ['I2']));

    const ancestors = getAncestors(graph, 'I1');

    // The algorithm will find the parent ID 'I2' and add it to ancestors,
    // but when it processes 'I2' from the queue, graph.get('I2') will return undefined,
    // so it just continues without throwing an error or finding further ancestors.
    expect(ancestors.size).toBe(1);
    expect(ancestors.get('I2')).toEqual(['I1', 'I2']);
  });

  it('should avoid infinite loops with circular parent references', () => {
    const graph: GenealogyGraph = new Map();
    // Circular reference: I1 -> I2 -> I1
    graph.set('I1', createMockNode('I1', 'Person A', ['I2']));
    graph.set('I2', createMockNode('I2', 'Person B', ['I1']));

    const ancestors = getAncestors(graph, 'I1');

    // The algorithm should visit I2, see its parent is I1,
    // but since ancestors doesn't have I1 initially, it adds I1.
    // However, when it checks I1's parents (I2), it won't re-add I2
    // because I2 is already in the ancestors map.
    expect(ancestors.size).toBe(2);
    expect(ancestors.get('I2')).toEqual(['I1', 'I2']);
    expect(ancestors.get('I1')).toEqual(['I1', 'I2', 'I1']);
  });
});
