import { describe, it, expect } from 'vitest';
import { findFloatingTrees } from '../analysis';
import { GenealogyGraph, GraphNode } from '../graph';
import { MatchResult } from '../algorithms';

describe('findFloatingTrees', () => {
  const createMockNode = (id: string, overrides: Partial<GraphNode> = {}): GraphNode => ({
    individual: {
      id,
      name: `Person ${id}`,
      givenName: 'Person',
      surname: id,
    },
    parents: [],
    children: [],
    spouses: [],
    ...overrides,
  });

  it('should identify floating components correctly with a main tree root', () => {
    const graph: GenealogyGraph = new Map();

    // Component 1 (Main tree with ID '1')
    graph.set('1', createMockNode('1', { children: ['2'] }));
    graph.set('2', createMockNode('2', { parents: ['1'] }));

    // Component 2 (Floating tree with IDs '3' and '4')
    graph.set('3', createMockNode('3', { spouses: ['4'] }));
    graph.set('4', createMockNode('4', { spouses: ['3'] }));

    // Component 3 (Floating single node '5')
    graph.set('5', createMockNode('5'));

    const floatingTrees = findFloatingTrees(graph, '1');

    expect(floatingTrees.length).toBe(2);

    const treeA = floatingTrees.find(t => t.members.includes('3'));
    expect(treeA).toBeDefined();
    expect(treeA?.size).toBe(2);
    expect(treeA?.members).toEqual(expect.arrayContaining(['3', '4']));

    const treeB = floatingTrees.find(t => t.members.includes('5'));
    expect(treeB).toBeDefined();
    expect(treeB?.size).toBe(1);
    expect(treeB?.members).toEqual(expect.arrayContaining(['5']));
  });

  it('should return all components if no main tree root is provided', () => {
    const graph: GenealogyGraph = new Map();

    graph.set('1', createMockNode('1', { children: ['2'] }));
    graph.set('2', createMockNode('2', { parents: ['1'] }));
    graph.set('3', createMockNode('3', { spouses: ['4'] }));
    graph.set('4', createMockNode('4', { spouses: ['3'] }));
    graph.set('5', createMockNode('5'));

    const floatingTrees = findFloatingTrees(graph);

    expect(floatingTrees.length).toBe(3);
    expect(floatingTrees.find(t => t.members.includes('1'))).toBeDefined();
    expect(floatingTrees.find(t => t.members.includes('3'))).toBeDefined();
    expect(floatingTrees.find(t => t.members.includes('5'))).toBeDefined();
  });

  it('should identify DNA matches within floating trees', () => {
    const graph: GenealogyGraph = new Map();

    graph.set('1', createMockNode('1', { children: ['2'] }));
    graph.set('2', createMockNode('2', { parents: ['1'] }));

    graph.set('3', createMockNode('3', { spouses: ['4'] }));
    graph.set('4', createMockNode('4', { spouses: ['3'] }));
    graph.set('5', createMockNode('5'));

    const matches: MatchResult[] = [
      {
        dnaMatch: { name: 'Match A', cM: 100 },
        matchedIndividualId: '4', // In floating tree 1
        status: 'Localizado'
      },
      {
        dnaMatch: { name: 'Match B', cM: 50 },
        matchedIndividualId: '5', // In floating tree 2
        status: 'Localizado'
      },
      {
        dnaMatch: { name: 'Match C', cM: 200 },
        matchedIndividualId: '2', // In main tree (should be filtered out)
        status: 'Localizado'
      }
    ];

    const floatingTrees = findFloatingTrees(graph, '1', matches);

    const treeA = floatingTrees.find(t => t.members.includes('3'));
    expect(treeA?.hasDNAMatch).toBe(true);
    expect(treeA?.dnaMatches).toContain('Match A (100 cM)');

    const treeB = floatingTrees.find(t => t.members.includes('5'));
    expect(treeB?.hasDNAMatch).toBe(true);
    expect(treeB?.dnaMatches).toContain('Match B (50 cM)');
  });

  it('should select representative with fewest parents', () => {
    const graph: GenealogyGraph = new Map();

    // Node 3 has 0 parents, Node 4 has 1 parent (Node 3 is best representative)
    graph.set('3', createMockNode('3', { children: ['4'], parents: [] }));
    graph.set('4', createMockNode('4', { parents: ['3'] }));

    const floatingTrees = findFloatingTrees(graph);

    expect(floatingTrees.length).toBe(1);
    expect(floatingTrees[0].id).toBe('3');
  });

  it('should handle empty graph', () => {
    const graph: GenealogyGraph = new Map();
    const floatingTrees = findFloatingTrees(graph);
    expect(floatingTrees.length).toBe(0);
  });
});
