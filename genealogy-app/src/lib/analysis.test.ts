import { describe, it, expect } from 'vitest';
import { findFloatingTrees } from './analysis';
import { GenealogyGraph, GraphNode } from './graph';
import { MatchResult } from './algorithms';

describe('findFloatingTrees', () => {
  // Helper to create a basic graph node for testing
  const createMockNode = (id: string, name: string, parents: string[] = [], children: string[] = [], spouses: string[] = []): GraphNode => ({
    individual: {
      id,
      name,
      givenName: name.split(' ')[0] || '',
      surname: name.split(' ')[1] || '',
    },
    parents,
    children,
    spouses
  });

  it('should identify a single main tree and correctly handle multiple disconnected trees', () => {
    const graph: GenealogyGraph = new Map();

    // Tree 1: Main tree (e.g., A - B - C)
    graph.set('A', createMockNode('A', 'Person A', [], ['B']));
    graph.set('B', createMockNode('B', 'Person B', ['A'], ['C']));
    graph.set('C', createMockNode('C', 'Person C', ['B'], []));

    // Tree 2: Floating tree 1 (e.g., D - E)
    graph.set('D', createMockNode('D', 'Person D', [], ['E']));
    graph.set('E', createMockNode('E', 'Person E', ['D'], []));

    // Tree 3: Floating tree 2 (e.g., F only)
    graph.set('F', createMockNode('F', 'Person F', [], []));

    // When we don't specify a mainTreeRootId, it should find all 3 components
    const allTrees = findFloatingTrees(graph);
    expect(allTrees).toHaveLength(3);

    // When we specify a root ID in Tree 1, it should exclude Tree 1
    const floatingTrees = findFloatingTrees(graph, 'A');
    expect(floatingTrees).toHaveLength(2);

    const treeSizes = floatingTrees.map(t => t.size).sort((a, b) => a - b);
    expect(treeSizes).toEqual([1, 2]); // Tree 3 size 1, Tree 2 size 2

    // Check if the members are correctly assigned
    const dTree = floatingTrees.find(t => t.members.includes('D'));
    expect(dTree).toBeDefined();
    expect(dTree?.members).toContain('E');

    const fTree = floatingTrees.find(t => t.members.includes('F'));
    expect(fTree).toBeDefined();
    expect(fTree?.members.length).toBe(1);
  });

  it('should correctly map DNA matches to floating trees', () => {
    const graph: GenealogyGraph = new Map();

    // Floating Tree 1 (A - B)
    graph.set('A', createMockNode('A', 'Person A', [], ['B']));
    graph.set('B', createMockNode('B', 'Person B', ['A'], []));

    // Floating Tree 2 (C)
    graph.set('C', createMockNode('C', 'Person C', [], []));

    const matches: MatchResult[] = [
      {
        dnaMatch: { name: 'Match 1', cM: 100 },
        matchedIndividualId: 'B',
        matchedIndividualName: 'Person B',
        status: 'Localizado',
      },
      {
        dnaMatch: { name: 'Match 2', cM: 50 },
        matchedIndividualId: 'Unrelated', // Doesn't exist in graph
        matchedIndividualName: 'Unrelated Person',
        status: 'Localizado',
      }
    ];

    const floatingTrees = findFloatingTrees(graph, undefined, matches);

    const aTree = floatingTrees.find(t => t.members.includes('A'));
    expect(aTree).toBeDefined();
    expect(aTree?.hasDNAMatch).toBe(true);
    expect(aTree?.dnaMatches).toContain('Match 1 (100 cM)');
    expect(aTree?.dnaMatches).toHaveLength(1);

    const cTree = floatingTrees.find(t => t.members.includes('C'));
    expect(cTree).toBeDefined();
    expect(cTree?.hasDNAMatch).toBe(false);
    expect(cTree?.dnaMatches).toHaveLength(0);
  });

  it('should choose a representative node with the fewest parents', () => {
    const graph: GenealogyGraph = new Map();

    // Tree (Child has 2 parents, parents have 0)
    graph.set('Child', createMockNode('Child', 'Child', ['Parent1', 'Parent2'], []));
    graph.set('Parent1', createMockNode('Parent1', 'Parent 1', [], ['Child']));
    graph.set('Parent2', createMockNode('Parent2', 'Parent 2', [], ['Child']));

    const floatingTrees = findFloatingTrees(graph);
    expect(floatingTrees).toHaveLength(1);

    const representative = floatingTrees[0].id;
    // Parent1 or Parent2 has 0 parents, Child has 2, so it should be one of the parents
    expect(['Parent1', 'Parent2']).toContain(representative);
  });
});
