import { describe, it, expect } from 'vitest';
import { findFloatingTrees } from '../analysis';
import { GenealogyGraph, GraphNode } from '../graph';
import { MatchResult } from '../algorithms';

function createMockGraph(nodesConfig: Record<string, Partial<GraphNode>>): GenealogyGraph {
  const graph = new Map<string, GraphNode>();
  for (const [id, config] of Object.entries(nodesConfig)) {
    graph.set(id, {
      individual: { id, name: `Person ${id}`, givenName: `Person`, surname: `${id}` },
      parents: config.parents || [],
      children: config.children || [],
      spouses: config.spouses || []
    });
  }
  return graph;
}

describe('findFloatingTrees', () => {
  it('should return empty array for an empty graph', () => {
    const graph = new Map<string, GraphNode>();
    const result = findFloatingTrees(graph);
    expect(result).toEqual([]);
  });

  it('should find a single connected component', () => {
    const graph = createMockGraph({
      '1': { children: ['2'] },
      '2': { parents: ['1'] }
    });

    const result = findFloatingTrees(graph);
    expect(result).toHaveLength(1);
    expect(result[0].size).toBe(2);
    expect(result[0].members).toContain('1');
    expect(result[0].members).toContain('2');
    // Node '1' has 0 parents, '2' has 1. '1' should be representative.
    expect(result[0].id).toBe('1');
  });

  it('should find multiple disconnected subgraphs (floating trees)', () => {
    const graph = createMockGraph({
      // Tree A
      'A1': { children: ['A2'] },
      'A2': { parents: ['A1'] },
      // Tree B
      'B1': { spouses: ['B2'] },
      'B2': { spouses: ['B1'] }
    });

    const result = findFloatingTrees(graph);
    expect(result).toHaveLength(2);

    const treeA = result.find(t => t.members.includes('A1'));
    const treeB = result.find(t => t.members.includes('B1'));

    expect(treeA).toBeDefined();
    expect(treeA?.size).toBe(2);
    expect(treeB).toBeDefined();
    expect(treeB?.size).toBe(2);
  });

  it('should filter out the main tree if mainTreeRootId is provided', () => {
    const graph = createMockGraph({
      // Main Tree
      'Root': { children: ['Child1'] },
      'Child1': { parents: ['Root'] },
      // Floating Tree
      'F1': { children: ['F2'] },
      'F2': { parents: ['F1'] }
    });

    const result = findFloatingTrees(graph, 'Root');
    expect(result).toHaveLength(1);
    expect(result[0].members).toContain('F1');
    expect(result[0].members).toContain('F2');
    expect(result[0].members).not.toContain('Root');
  });

  it('should correctly map DNA matches to floating trees', () => {
    const graph = createMockGraph({
      'F1': { children: ['F2'] },
      'F2': { parents: ['F1'] }
    });

    const matches: MatchResult[] = [
      {
        dnaMatch: { name: 'Match1', cM: 100 },
        matchedIndividualId: 'F2',
        status: 'Localizado'
      },
      {
        dnaMatch: { name: 'Unrelated', cM: 50 },
        matchedIndividualId: 'X1',
        status: 'Localizado'
      }
    ];

    const result = findFloatingTrees(graph, undefined, matches);
    expect(result).toHaveLength(1);
    expect(result[0].hasDNAMatch).toBe(true);
    expect(result[0].dnaMatches).toContain('Match1 (100 cM)');
    expect(result[0].dnaMatches).not.toContain('Unrelated (50 cM)');
  });

  it('should select representative with fewest parents', () => {
    const graph = createMockGraph({
      'Child': { parents: ['Dad', 'Mom'] },
      'Dad': { children: ['Child'] },
      'Mom': { children: ['Child'] }
    });

    const result = findFloatingTrees(graph);
    expect(result).toHaveLength(1);
    // Dad and Mom both have 0 parents. Either is fine, but Child (2 parents) should not be selected.
    expect(['Dad', 'Mom']).toContain(result[0].id);
  });
});