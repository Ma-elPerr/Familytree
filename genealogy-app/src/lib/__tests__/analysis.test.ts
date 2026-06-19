import { describe, it, expect } from 'vitest';
import { findFloatingTrees, findDuplicates } from '../analysis';
import { GenealogyGraph, GraphNode } from '../graph';
import { MatchResult } from '../algorithms';

// Helper to create a mock node
function createMockNode(
  id: string,
  name: string,
  birthYear?: number,
  parents: string[] = [],
  children: string[] = [],
  spouses: string[] = []
): GraphNode {
  return {
    individual: { id, name, birthYear, sex: 'M' },
    parents,
    children,
    spouses,
  };
}

describe('analysis.ts', () => {
  describe('findFloatingTrees', () => {
    it('should find floating trees in a disconnected graph', () => {
      const graph: GenealogyGraph = new Map([
        ['A', createMockNode('A', 'Alice', 1900, [], ['B'], [])],
        ['B', createMockNode('B', 'Bob', 1920, ['A'], [], [])], // Component 1
        ['C', createMockNode('C', 'Charlie', 1910, [], [], [])], // Component 2 (Floating)
        ['D', createMockNode('D', 'David', 1930, [], ['E'], ['F'])],
        ['E', createMockNode('E', 'Eve', 1950, ['D', 'F'], [], [])],
        ['F', createMockNode('F', 'Frank', 1930, [], ['E'], ['D'])], // Component 3 (Floating)
      ]);

      const floatingTrees = findFloatingTrees(graph);
      expect(floatingTrees.length).toBe(3);

      // Sizes check
      const sizes = floatingTrees.map(t => t.size).sort();
      expect(sizes).toEqual([1, 2, 3]);

      // Check for component contents
      const members = floatingTrees.map(t => [...t.members].sort());
      expect(members).toContainEqual(['A', 'B']);
      expect(members).toContainEqual(['C']);
      expect(members).toContainEqual(['D', 'E', 'F']);
    });

    it('should exclude the main tree when mainTreeRootId is provided', () => {
      const graph: GenealogyGraph = new Map([
        ['A', createMockNode('A', 'Alice', 1900, [], ['B'], [])],
        ['B', createMockNode('B', 'Bob', 1920, ['A'], [], [])], // Component 1 (Main tree)
        ['C', createMockNode('C', 'Charlie', 1910, [], [], [])], // Component 2 (Floating)
      ]);

      const floatingTrees = findFloatingTrees(graph, 'A');
      expect(floatingTrees.length).toBe(1);
      expect(floatingTrees[0].members).toEqual(['C']);
    });

    it('should pick the representative node with fewest parents', () => {
      const graph: GenealogyGraph = new Map([
        ['Child', createMockNode('Child', 'Child', 2000, ['Parent1', 'Parent2'], [], [])],
        ['Parent1', createMockNode('Parent1', 'P1', 1970, [], ['Child'], [])],
        ['Parent2', createMockNode('Parent2', 'P2', 1975, ['Grandparent'], ['Child'], [])],
        ['Grandparent', createMockNode('Grandparent', 'GP', 1950, [], ['Parent2'], [])],
      ]);

      const floatingTrees = findFloatingTrees(graph);
      expect(floatingTrees.length).toBe(1);

      const tree = floatingTrees[0];
      // Grandparent and Parent1 both have 0 parents. The algorithm will pick one of them.
      expect(['Grandparent', 'Parent1']).toContain(tree.id);
    });

    it('should properly identify DNA matches in a floating tree', () => {
      const graph: GenealogyGraph = new Map([
        ['A', createMockNode('A', 'Alice', 1900, [], ['B'], [])],
        ['B', createMockNode('B', 'Bob', 1920, ['A'], [], [])], // Floating Tree 1
        ['C', createMockNode('C', 'Charlie', 1910, [], [], [])], // Floating Tree 2
      ]);

      const matches: MatchResult[] = [
        {
          dnaMatch: { name: 'Bobby Match', cM: 150 },
          matchedIndividualId: 'B',
          matchedIndividualName: 'Bob',
          status: 'Localizado',
        },
        {
          dnaMatch: { name: 'Unknown Match', cM: 50 },
          status: 'Não Localizado',
        }
      ];

      const floatingTrees = findFloatingTrees(graph, undefined, matches);
      expect(floatingTrees.length).toBe(2);

      const tree1 = floatingTrees.find(t => t.members.includes('A'));
      expect(tree1?.hasDNAMatch).toBe(true);
      expect(tree1?.dnaMatches).toContain('Bobby Match (150 cM)');

      const tree2 = floatingTrees.find(t => t.members.includes('C'));
      expect(tree2?.hasDNAMatch).toBe(false);
      expect(tree2?.dnaMatches.length).toBe(0);
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicates based on matching name and birth year', () => {
      const graph: GenealogyGraph = new Map([
        ['1', createMockNode('1', 'John Doe', 1900)],
        ['2', createMockNode('2', 'john doe ', 1900)], // Duplicate of 1
        ['3', createMockNode('3', 'Jane Doe', 1905)],
        ['4', createMockNode('4', 'Jane Doe')], // Different because birth year is undefined
        ['5', createMockNode('5', 'John Doe', 1901)], // Different birth year
        ['6', createMockNode('6', 'Jane Doe', undefined)], // Duplicate of 4
      ]);

      const duplicates = findDuplicates(graph);
      expect(duplicates.length).toBe(2);

      const johnDup = duplicates.find(d => d.name === 'john doe');
      expect(johnDup).toBeDefined();
      expect(johnDup?.birthYear).toBe(1900);
      expect(johnDup?.individuals).toContain('1');
      expect(johnDup?.individuals).toContain('2');

      const janeDup = duplicates.find(d => d.name === 'jane doe');
      expect(janeDup).toBeDefined();
      expect(janeDup?.birthYear).toBeUndefined();
      expect(janeDup?.individuals).toContain('4');
      expect(janeDup?.individuals).toContain('6');
    });

    it('should skip nodes with "Unknown" names or no names', () => {
      const graph: GenealogyGraph = new Map([
        ['1', createMockNode('1', 'Unknown', 1900)],
        ['2', createMockNode('2', 'Unknown', 1900)], // Would be duplicate, but skipped
        ['3', createMockNode('3', '', 1900)],
        ['4', createMockNode('4', '', 1900)], // Would be duplicate, but skipped
      ]);

      const duplicates = findDuplicates(graph);
      expect(duplicates.length).toBe(0);
    });

    it('should return empty array when there are no duplicates', () => {
      const graph: GenealogyGraph = new Map([
        ['1', createMockNode('1', 'John Doe', 1900)],
        ['2', createMockNode('2', 'Jane Doe', 1905)],
        ['3', createMockNode('3', 'Jim Doe', 1910)],
      ]);

      const duplicates = findDuplicates(graph);
      expect(duplicates.length).toBe(0);
    });
  });
});
