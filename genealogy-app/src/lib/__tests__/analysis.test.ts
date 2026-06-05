import { describe, it, expect } from 'vitest';
import { findFloatingTrees } from '../analysis';
import { GenealogyGraph, GraphNode } from '../graph';
import { MatchResult } from '../algorithms';

// Helper to create a dummy GraphNode
function createNode(id: string, parents: string[] = [], children: string[] = [], spouses: string[] = []): GraphNode {
  return {
    individual: { id, name: `Name_${id}`, sex: 'U' },
    parents,
    children,
    spouses
  };
}

describe('findFloatingTrees', () => {

  it('should return empty array for an empty graph', () => {
    const graph: GenealogyGraph = new Map();
    const result = findFloatingTrees(graph);
    expect(result).toEqual([]);
  });

  it('should correctly identify all connected components when no mainTreeRootId is provided', () => {
    const graph: GenealogyGraph = new Map();

    // Component 1: A, B
    graph.set('A', createNode('A', [], ['B'], []));
    graph.set('B', createNode('B', ['A'], [], []));

    // Component 2: C, D, E
    graph.set('C', createNode('C', [], ['D', 'E'], []));
    graph.set('D', createNode('D', ['C'], [], []));
    graph.set('E', createNode('E', ['C'], [], []));

    // Component 3: F (isolated)
    graph.set('F', createNode('F', [], [], []));

    const result = findFloatingTrees(graph);

    expect(result.length).toBe(3);

    // Component 1
    const comp1 = result.find(c => c.members.includes('A'));
    expect(comp1?.members.sort()).toEqual(['A', 'B']);
    expect(comp1?.size).toBe(2);

    // Component 2
    const comp2 = result.find(c => c.members.includes('C'));
    expect(comp2?.members.sort()).toEqual(['C', 'D', 'E']);
    expect(comp2?.size).toBe(3);

    // Component 3
    const comp3 = result.find(c => c.members.includes('F'));
    expect(comp3?.members.sort()).toEqual(['F']);
    expect(comp3?.size).toBe(1);
  });

  it('should filter out the main tree if mainTreeRootId is provided', () => {
    const graph: GenealogyGraph = new Map();

    // Component 1 (Main): A, B
    graph.set('A', createNode('A', [], ['B'], []));
    graph.set('B', createNode('B', ['A'], [], []));

    // Component 2 (Floating): C, D
    graph.set('C', createNode('C', [], ['D'], []));
    graph.set('D', createNode('D', ['C'], [], []));

    // A is part of the main tree
    const result = findFloatingTrees(graph, 'A');

    expect(result.length).toBe(1);
    expect(result[0].members.sort()).toEqual(['C', 'D']);
    expect(result[0].size).toBe(2);
  });

  it('should select the node with the fewest parents as the representative id', () => {
    const graph: GenealogyGraph = new Map();

    // Component: C (0 parents), D (1 parent), E (2 parents)
    graph.set('E', createNode('E', ['C', 'D'], [], []));
    graph.set('D', createNode('D', ['C'], ['E'], []));
    graph.set('C', createNode('C', [], ['D', 'E'], []));

    const result = findFloatingTrees(graph);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('C');
  });

  it('should attach DNA match info correctly if matches are provided', () => {
    const graph: GenealogyGraph = new Map();

    graph.set('C', createNode('C', [], ['D'], []));
    graph.set('D', createNode('D', ['C'], [], []));

    const matches: MatchResult[] = [
      {
        dnaMatch: { name: 'John Doe', cM: 100 },
        matchedIndividualId: 'D',
        isFuzzy: false
      },
      {
        dnaMatch: { name: 'Jane Smith', cM: 50 },
        matchedIndividualId: 'UnknownId', // Not in graph
        isFuzzy: false
      }
    ];

    const result = findFloatingTrees(graph, undefined, matches);

    expect(result.length).toBe(1);
    expect(result[0].hasDNAMatch).toBe(true);
    expect(result[0].dnaMatches).toEqual(['John Doe (100 cM)']);
  });

});
