import { describe, it, expect } from 'vitest';
import { findFloatingTrees } from './analysis';
import { GenealogyGraph, GraphNode } from './graph';
import { MatchResult } from './algorithms';

describe('findFloatingTrees', () => {
  const createNode = (id: string, name: string, parents: string[] = [], children: string[] = [], spouses: string[] = []): GraphNode => ({
    individual: { id, name, givenName: name, surname: '' },
    parents,
    children,
    spouses
  });

  it('should return an empty array for an empty graph', () => {
    const graph: GenealogyGraph = new Map();
    const result = findFloatingTrees(graph);
    expect(result).toEqual([]);
  });

  it('should find a single connected component', () => {
    const graph: GenealogyGraph = new Map([
      ['1', createNode('1', 'Parent1', [], ['3'], ['2'])],
      ['2', createNode('2', 'Parent2', [], ['3'], ['1'])],
      ['3', createNode('3', 'Child1', ['1', '2'], [], [])],
    ]);

    const result = findFloatingTrees(graph);
    expect(result.length).toBe(1);
    expect(result[0].size).toBe(3);
    expect(result[0].members).toEqual(expect.arrayContaining(['1', '2', '3']));
  });

  it('should find multiple disconnected components', () => {
    const graph: GenealogyGraph = new Map([
      // Component 1
      ['1', createNode('1', 'Tree1_Node1', [], ['2'], [])],
      ['2', createNode('2', 'Tree1_Node2', ['1'], [], [])],
      // Component 2
      ['3', createNode('3', 'Tree2_Node1', [], ['4'], [])],
      ['4', createNode('4', 'Tree2_Node2', ['3'], [], [])],
    ]);

    const result = findFloatingTrees(graph);
    expect(result.length).toBe(2);

    const sizes = result.map(t => t.size).sort();
    expect(sizes).toEqual([2, 2]);

    const allMembers = result.flatMap(t => t.members);
    expect(allMembers).toEqual(expect.arrayContaining(['1', '2', '3', '4']));
  });

  it('should exclude the main tree when mainTreeRootId is provided', () => {
    const graph: GenealogyGraph = new Map([
      // Main Tree
      ['root', createNode('root', 'MainRoot', [], ['child1'], [])],
      ['child1', createNode('child1', 'MainChild', ['root'], [], [])],
      // Floating Tree
      ['f1', createNode('f1', 'FloatRoot', [], ['f2'], [])],
      ['f2', createNode('f2', 'FloatChild', ['f1'], [], [])],
    ]);

    const result = findFloatingTrees(graph, 'root');
    expect(result.length).toBe(1);
    expect(result[0].members).toEqual(expect.arrayContaining(['f1', 'f2']));
    expect(result[0].members).not.toContain('root');
    expect(result[0].members).not.toContain('child1');
  });

  it('should pick the node with fewest parents as representative', () => {
    const graph: GenealogyGraph = new Map([
      ['child', createNode('child', 'Child', ['parent1', 'parent2'], [], [])], // 2 parents
      ['parent1', createNode('parent1', 'Parent1', ['grandparent'], ['child'], [])], // 1 parent
      ['parent2', createNode('parent2', 'Parent2', [], ['child'], [])], // 0 parents
      ['grandparent', createNode('grandparent', 'Grandparent', [], ['parent1'], [])] // 0 parents
    ]);

    const result = findFloatingTrees(graph);
    expect(result.length).toBe(1);

    // Representative should be 'parent2' or 'grandparent' as both have 0 parents
    expect(['parent2', 'grandparent']).toContain(result[0].id);
  });

  it('should correctly map DNA matches to floating trees', () => {
    const graph: GenealogyGraph = new Map([
      // Main tree
      ['m1', createNode('m1', 'MainTree', [], [], [])],
      // Floating tree 1 with DNA match
      ['f1', createNode('f1', 'FloatTree1', [], [], [])],
      // Floating tree 2 without DNA match
      ['f2', createNode('f2', 'FloatTree2', [], [], [])],
    ]);

    const matches: MatchResult[] = [
      {
        dnaMatch: { name: 'John Doe', cM: 150 },
        matchedIndividualId: 'f1',
        matchedIndividualName: 'FloatTree1',
        status: 'Localizado'
      }
    ];

    const result = findFloatingTrees(graph, 'm1', matches);
    expect(result.length).toBe(2);

    const matchTree = result.find(t => t.members.includes('f1'));
    const nonMatchTree = result.find(t => t.members.includes('f2'));

    expect(matchTree).toBeDefined();
    expect(matchTree!.hasDNAMatch).toBe(true);
    expect(matchTree!.dnaMatches).toContain('John Doe (150 cM)');

    expect(nonMatchTree).toBeDefined();
    expect(nonMatchTree!.hasDNAMatch).toBe(false);
    expect(nonMatchTree!.dnaMatches.length).toBe(0);
  });
});
