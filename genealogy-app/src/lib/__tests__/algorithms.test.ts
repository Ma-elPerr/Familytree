import { describe, it, expect } from 'vitest';
import { findMRCA } from '../algorithms';
import { GenealogyGraph, GraphNode } from '../graph';
import { GedcomIndividual } from '../parsers';

// Helper to create a basic individual
function createIndividual(id: string, name: string): GedcomIndividual {
  return {
    id,
    name,
    givenName: name.split(' ')[0] || '',
    surname: name.split(' ')[1] || '',
  };
}

// Helper to create a graph node
function createNode(individual: GedcomIndividual, parents: string[] = [], children: string[] = [], spouses: string[] = []): GraphNode {
  return {
    individual,
    parents,
    children,
    spouses,
  };
}

// Helper to build a test graph
function buildTestGraph(): GenealogyGraph {
  const graph: GenealogyGraph = new Map();

  // Family Tree Structure:
  //      GreatGrandpa
  //           |
  //       Grandpa
  //      /       \
  //   Parent1  Parent2
  //     |         |
  //   Child1    Child2
  //
  // Unrelated:
  //   Stranger

  graph.set('GreatGrandpa', createNode(createIndividual('GreatGrandpa', 'Great Grandpa'), [], ['Grandpa']));
  graph.set('Grandpa', createNode(createIndividual('Grandpa', 'Grandpa Smith'), ['GreatGrandpa'], ['Parent1', 'Parent2']));

  graph.set('Parent1', createNode(createIndividual('Parent1', 'Parent One'), ['Grandpa'], ['Child1']));
  graph.set('Parent2', createNode(createIndividual('Parent2', 'Parent Two'), ['Grandpa'], ['Child2']));

  graph.set('Child1', createNode(createIndividual('Child1', 'Child One'), ['Parent1'], []));
  graph.set('Child2', createNode(createIndividual('Child2', 'Child Two'), ['Parent2'], []));

  graph.set('Stranger', createNode(createIndividual('Stranger', 'Stranger Danger'), [], []));

  return graph;
}

describe('findMRCA', () => {
  const graph = buildTestGraph();

  it('should return the same node when root and target are identical', () => {
    const result = findMRCA(graph, 'Child1', 'Child1');
    expect(result).toEqual({
      mrcaId: 'Child1',
      mrcaName: 'Child One',
      path1: ['Child1'],
      path2: ['Child1']
    });
  });

  it('should return root as MRCA when root is an ancestor of target', () => {
    // Parent1 is an ancestor of Child1
    const result = findMRCA(graph, 'Parent1', 'Child1');
    expect(result).toEqual({
      mrcaId: 'Parent1',
      mrcaName: 'Parent One',
      path1: ['Parent1'],
      // Assuming getAncestors returns path from startNode to ancestor,
      // targetAncestors.get('Parent1') should be ['Child1', 'Parent1']
      path2: ['Child1', 'Parent1']
    });
  });

  it('should return target as MRCA when target is an ancestor of root', () => {
    // Grandpa is an ancestor of Child1
    const result = findMRCA(graph, 'Child1', 'Grandpa');
    expect(result).toEqual({
      mrcaId: 'Grandpa',
      mrcaName: 'Grandpa Smith',
      // rootAncestors.get('Grandpa') should be ['Child1', 'Parent1', 'Grandpa']
      path1: ['Child1', 'Parent1', 'Grandpa'],
      path2: ['Grandpa']
    });
  });

  it('should find the closest common ancestor (MRCA) for cousins', () => {
    // Child1 and Child2 share Grandpa as their MRCA
    const result = findMRCA(graph, 'Child1', 'Child2');
    expect(result).toEqual({
      mrcaId: 'Grandpa',
      mrcaName: 'Grandpa Smith',
      path1: ['Child1', 'Parent1', 'Grandpa'],
      path2: ['Child2', 'Parent2', 'Grandpa']
    });
  });

  it('should return empty object if no common ancestor exists', () => {
    const result = findMRCA(graph, 'Child1', 'Stranger');
    expect(result).toEqual({});
  });
});
