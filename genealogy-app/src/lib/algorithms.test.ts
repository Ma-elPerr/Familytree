import { matchDNA, findMRCA, processMatches } from './algorithms';
import { GenealogyGraph, GraphNode } from './graph';
import { DNAMatch } from './parsers';

describe('algorithms', () => {
  let graph: GenealogyGraph;

  beforeEach(() => {
    graph = new Map<string, GraphNode>();

    // Helper to add nodes easily
    const addNode = (id: string, name: string, parents: string[] = [], children: string[] = []) => {
      graph.set(id, {
        individual: { id, name, givenName: name, surname: '' },
        parents,
        children,
        spouses: []
      });
    };

    addNode('1', 'John Doe', [], ['2', '3']);
    addNode('2', 'Jane Doe', ['1'], ['4']);
    addNode('3', 'Jim Doe', ['1'], []);
    addNode('4', 'Baby Doe', ['2'], []);
    addNode('5', 'Unrelated Person', [], []);
  });

  describe('matchDNA', () => {
    it('finds an exact match', () => {
      const matches: DNAMatch[] = [{ name: 'John Doe', cM: 100 }];
      const result = matchDNA(matches, graph);
      expect(result).toHaveLength(1);
      expect(result[0].matchedIndividualId).toBe('1');
      expect(result[0].status).toBe('Localizado');
    });

    it('finds a partial match', () => {
      const matches: DNAMatch[] = [{ name: 'John', cM: 100 }];
      const result = matchDNA(matches, graph);
      expect(result).toHaveLength(1);
      expect(result[0].matchedIndividualId).toBe('1'); // 'John' is in 'John Doe'
      expect(result[0].status).toBe('Localizado');
    });

    it('finds a fuzzy match', () => {
      const matches: DNAMatch[] = [{ name: 'Jon Doe', cM: 100 }]; // Missing 'h'
      const result = matchDNA(matches, graph);
      expect(result).toHaveLength(1);
      expect(result[0].matchedIndividualId).toBe('1');
      expect(result[0].status).toBe('Localizado');
    });

    it('does not find a match for unrelated names', () => {
      const matches: DNAMatch[] = [{ name: 'Nonexistent Name', cM: 100 }];
      const result = matchDNA(matches, graph);
      expect(result).toHaveLength(1);
      expect(result[0].matchedIndividualId).toBeUndefined();
      expect(result[0].status).toBe('Não Localizado');
    });
  });

  describe('findMRCA', () => {
    it('returns the same node when root and target are identical', () => {
      const result = findMRCA(graph, '1', '1');
      expect(result.mrcaId).toBe('1');
      expect(result.path1).toEqual(['1']);
      expect(result.path2).toEqual(['1']);
    });

    it('finds MRCA when root is ancestor of target', () => {
      // 1 -> 2 -> 4
      const result = findMRCA(graph, '1', '4');
      expect(result.mrcaId).toBe('1');
      expect(result.path1).toEqual(['1']);
      expect(result.path2).toEqual(['4', '2', '1']);
    });

    it('finds MRCA when target is ancestor of root', () => {
      const result = findMRCA(graph, '4', '1');
      expect(result.mrcaId).toBe('1');
      expect(result.path1).toEqual(['4', '2', '1']);
      expect(result.path2).toEqual(['1']);
    });

    it('finds MRCA when root and target share a common ancestor', () => {
      // 2 and 3 share ancestor 1
      const result = findMRCA(graph, '2', '3');
      expect(result.mrcaId).toBe('1');
      expect(result.path1).toEqual(['2', '1']);
      expect(result.path2).toEqual(['3', '1']);
    });

    it('returns empty object when no common ancestor exists', () => {
      const result = findMRCA(graph, '1', '5');
      expect(result.mrcaId).toBeUndefined();
    });
  });

  describe('processMatches', () => {
    it('processes matches and finds MRCA if rootNodeId is provided', () => {
      const matches: DNAMatch[] = [{ name: 'Baby Doe', cM: 100 }];
      const result = processMatches(matches, graph, '1'); // root is '1'

      expect(result).toHaveLength(1);
      expect(result[0].matchedIndividualId).toBe('4');
      expect(result[0].mrcaId).toBe('1');
      // path2 from findMRCA (target to MRCA): '4' -> '2' -> '1'
      expect(result[0].pathToMrca).toEqual(['4', '2', '1']);
    });

    it('only matches if rootNodeId is not provided', () => {
      const matches: DNAMatch[] = [{ name: 'Baby Doe', cM: 100 }];
      const result = processMatches(matches, graph);

      expect(result).toHaveLength(1);
      expect(result[0].matchedIndividualId).toBe('4');
      expect(result[0].mrcaId).toBeUndefined();
      expect(result[0].pathToMrca).toBeUndefined();
    });
  });
});
