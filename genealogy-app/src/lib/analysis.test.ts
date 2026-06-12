import { describe, it, expect } from 'vitest';
import { findFloatingTrees } from './analysis';
import { GenealogyGraph, GraphNode } from './graph';
import { MatchResult } from './algorithms';

// Helper to create a basic graph node for tests
function createNode(id: string): GraphNode {
  return {
    individual: {
      id,
      name: `Person ${id}`,
      givenName: 'Person',
      surname: id,
    },
    parents: [],
    children: [],
    spouses: []
  };
}

describe('findFloatingTrees', () => {
  it('identifies disconnected components correctly', () => {
    const graph: GenealogyGraph = new Map();

    // Component 1: Node 1 and Node 2 connected
    const n1 = createNode('1');
    const n2 = createNode('2');
    n1.children = ['2'];
    n2.parents = ['1'];
    graph.set('1', n1);
    graph.set('2', n2);

    // Component 2: Node 3 isolated
    const n3 = createNode('3');
    graph.set('3', n3);

    // Component 3: Node 4 and Node 5 connected
    const n4 = createNode('4');
    const n5 = createNode('5');
    n4.spouses = ['5'];
    n5.spouses = ['4'];
    graph.set('4', n4);
    graph.set('5', n5);

    const trees = findFloatingTrees(graph);

    expect(trees).toHaveLength(3);

    // Check sizes and members
    const tree1 = trees.find(t => t.members.includes('1'));
    expect(tree1?.size).toBe(2);
    expect(tree1?.members).toEqual(expect.arrayContaining(['1', '2']));

    const tree2 = trees.find(t => t.members.includes('3'));
    expect(tree2?.size).toBe(1);
    expect(tree2?.members).toEqual(['3']);

    const tree3 = trees.find(t => t.members.includes('4'));
    expect(tree3?.size).toBe(2);
    expect(tree3?.members).toEqual(expect.arrayContaining(['4', '5']));
  });

  it('excludes the main tree when mainTreeRootId is provided', () => {
    const graph: GenealogyGraph = new Map();

    // Main Tree: 1 and 2
    const n1 = createNode('1');
    const n2 = createNode('2');
    n1.children = ['2'];
    n2.parents = ['1'];
    graph.set('1', n1);
    graph.set('2', n2);

    // Floating Tree: 3
    const n3 = createNode('3');
    graph.set('3', n3);

    // Passing any node in the main tree component should exclude the whole component
    const trees = findFloatingTrees(graph, '1');

    expect(trees).toHaveLength(1);
    expect(trees[0].id).toBe('3');
    expect(trees[0].members).toEqual(['3']);
  });

  it('selects the representative node with fewest parents', () => {
    const graph: GenealogyGraph = new Map();

    const n1 = createNode('1');
    const n2 = createNode('2');
    const n3 = createNode('3');

    // n3 has 2 parents (n1, n2)
    // n1 and n2 have 0 parents
    n1.children = ['3'];
    n2.children = ['3'];
    n3.parents = ['1', '2'];

    graph.set('1', n1);
    graph.set('2', n2);
    graph.set('3', n3);

    const trees = findFloatingTrees(graph);

    expect(trees).toHaveLength(1);
    // Should be '1' or '2', but never '3' since '3' has more parents
    expect(['1', '2']).toContain(trees[0].id);
  });

  it('associates DNA matches correctly', () => {
    const graph: GenealogyGraph = new Map();

    const n1 = createNode('1');
    const n2 = createNode('2');
    n1.children = ['2'];
    n2.parents = ['1'];
    graph.set('1', n1);
    graph.set('2', n2);

    const n3 = createNode('3');
    graph.set('3', n3);

    const matches: MatchResult[] = [
      {
        dnaMatch: { name: 'Match A', cM: 100 },
        status: 'Localizado',
        matchedIndividualId: '2' // Match belongs to first tree
      },
      {
        dnaMatch: { name: 'Match B', cM: 50 },
        status: 'Não Localizado'
        // No matched individual
      }
    ];

    const trees = findFloatingTrees(graph, undefined, matches);

    expect(trees).toHaveLength(2);

    const tree1 = trees.find(t => t.members.includes('1'));
    expect(tree1?.hasDNAMatch).toBe(true);
    expect(tree1?.dnaMatches).toEqual(['Match A (100 cM)']);

    const tree3 = trees.find(t => t.members.includes('3'));
    expect(tree3?.hasDNAMatch).toBe(false);
    expect(tree3?.dnaMatches).toEqual([]);
  });
});
