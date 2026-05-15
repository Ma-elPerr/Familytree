import { findFloatingTrees, findDuplicates } from '../analysis';
import { GenealogyGraph, GraphNode } from '../graph';
import { MatchResult } from '../algorithms';

// Helper to create mock nodes for testing
function createMockNode(id: string, name: string, birthYear?: number, parents: string[] = [], children: string[] = [], spouses: string[] = []): GraphNode {
  return {
    individual: {
      id,
      name,
      givenName: name.split(' ')[0] || '',
      surname: name.split(' ')[1] || '',
      birthYear
    },
    parents,
    children,
    spouses
  };
}

describe('analysis.ts', () => {
  let graph: GenealogyGraph;

  beforeEach(() => {
    graph = new Map<string, GraphNode>();
  });

  describe('findFloatingTrees', () => {
    it('should find disconnected subgraphs (components)', () => {
      // Tree 1
      graph.set('A', createMockNode('A', 'Alice', 1900, [], ['B']));
      graph.set('B', createMockNode('B', 'Bob', 1920, ['A'], []));

      // Tree 2
      graph.set('C', createMockNode('C', 'Charlie', 1910, [], []));

      const trees = findFloatingTrees(graph);
      expect(trees).toHaveLength(2);

      const sizes = trees.map(t => t.size).sort();
      expect(sizes).toEqual([1, 2]); // one tree of size 1, one of size 2
    });

    it('should assign the representative based on minimum parents', () => {
      // A has 0 parents, B has 1 parent (A)
      graph.set('B', createMockNode('B', 'Bob', 1920, ['A'], []));
      graph.set('A', createMockNode('A', 'Alice', 1900, [], ['B']));

      const trees = findFloatingTrees(graph);
      expect(trees).toHaveLength(1);
      // 'A' should be the representative because it has 0 parents
      expect(trees[0].id).toBe('A');
    });

    it('should ignore the main tree if mainTreeRootId is provided', () => {
      // Main tree
      graph.set('A', createMockNode('A', 'Alice', 1900, [], ['B']));
      graph.set('B', createMockNode('B', 'Bob', 1920, ['A'], []));

      // Floating tree
      graph.set('C', createMockNode('C', 'Charlie', 1910, [], []));

      const trees = findFloatingTrees(graph, 'A');
      expect(trees).toHaveLength(1);
      expect(trees[0].members).toContain('C');
      expect(trees[0].members).not.toContain('A');
      expect(trees[0].members).not.toContain('B');
    });

    it('should correctly map hasDNAMatch and dnaMatches', () => {
      // Connect C and D so they form a single tree
      graph.set('C', createMockNode('C', 'Charlie', 1910, [], ['D']));
      graph.set('D', createMockNode('D', 'David', 1930, ['C'], []));

      const mockMatches: MatchResult[] = [
        {
          dnaMatch: { name: 'Match1', cM: 50 },
          matchedIndividualId: 'D',
          status: 'Localizado'
        }
      ];

      const trees = findFloatingTrees(graph, undefined, mockMatches);
      expect(trees).toHaveLength(1);
      expect(trees[0].hasDNAMatch).toBe(true);
      expect(trees[0].dnaMatches).toEqual(['Match1 (50 cM)']);
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicates based on exact lowercase name and birthYear', () => {
      // Two identical signatures
      graph.set('A', createMockNode('A', 'John Doe', 1900));
      graph.set('B', createMockNode('B', 'john doe ', 1900)); // Case insensitive and trimmed

      // A different person
      graph.set('C', createMockNode('C', 'Jane Doe', 1905));

      const duplicates = findDuplicates(graph);
      expect(duplicates).toHaveLength(1);

      const group = duplicates[0];
      expect(group.name).toBe('john doe'); // lowercase and trimmed by sig
      expect(group.birthYear).toBe(1900);
      expect(group.individuals.sort()).toEqual(['A', 'B'].sort());
    });

    it('should group unknown birth years together', () => {
      graph.set('A', createMockNode('A', 'John Doe', undefined));
      graph.set('B', createMockNode('B', 'John Doe', undefined));

      const duplicates = findDuplicates(graph);
      expect(duplicates).toHaveLength(1);

      const group = duplicates[0];
      expect(group.name).toBe('john doe');
      expect(group.birthYear).toBeUndefined();
      expect(group.individuals.sort()).toEqual(['A', 'B'].sort());
    });

    it('should ignore nodes with name "Unknown"', () => {
      graph.set('A', createMockNode('A', 'Unknown', 1900));
      graph.set('B', createMockNode('B', 'Unknown', 1900));

      const duplicates = findDuplicates(graph);
      expect(duplicates).toHaveLength(0);
    });

    it('should handle complex graphs with multiple duplicate sets', () => {
      graph.set('1', createMockNode('1', 'Alpha', 1900));
      graph.set('2', createMockNode('2', 'alpha', 1900));

      graph.set('3', createMockNode('3', 'Beta', 1910));
      graph.set('4', createMockNode('4', 'BETA ', 1910));
      graph.set('5', createMockNode('5', 'Beta', 1910));

      graph.set('6', createMockNode('6', 'Gamma', 1920));

      const duplicates = findDuplicates(graph);
      expect(duplicates).toHaveLength(2); // Alpha group and Beta group

      // Verify sizes of each duplicate group
      const alphaGroup = duplicates.find(d => d.name === 'alpha');
      const betaGroup = duplicates.find(d => d.name === 'beta');

      expect(alphaGroup?.individuals).toHaveLength(2);
      expect(betaGroup?.individuals).toHaveLength(3);
    });
  });

});
