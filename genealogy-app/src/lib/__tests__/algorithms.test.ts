import { describe, it, expect } from 'vitest';
import { findMRCA } from '../algorithms';
import { GenealogyGraph, GraphNode } from '../graph';

describe('findMRCA', () => {
  const createMockNode = (id: string, name: string, parents: string[] = [], children: string[] = [], spouses: string[] = []): GraphNode => ({
    individual: { id, name, givenName: name.split(' ')[0], surname: name.split(' ')[1] || '' },
    parents,
    children,
    spouses,
  });

  it('should return the root node itself when root and target are the same', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createMockNode('I1', 'Root Person'));

    const result = findMRCA(graph, 'I1', 'I1');
    expect(result).toEqual({ mrcaId: 'I1', mrcaName: 'Root Person', path1: ['I1'], path2: ['I1'] });
  });

  it('should return root as MRCA when root is an ancestor of target', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createMockNode('I1', 'Parent', [], ['I2']));
    graph.set('I2', createMockNode('I2', 'Child', ['I1']));

    const result = findMRCA(graph, 'I1', 'I2');
    expect(result).toEqual({
      mrcaId: 'I1',
      mrcaName: 'Parent',
      path1: ['I1'],
      path2: ['I2', 'I1']
    });
  });

  it('should return target as MRCA when target is an ancestor of root', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createMockNode('I1', 'Parent', [], ['I2']));
    graph.set('I2', createMockNode('I2', 'Child', ['I1']));

    const result = findMRCA(graph, 'I2', 'I1');
    expect(result).toEqual({
      mrcaId: 'I1',
      mrcaName: 'Parent',
      path1: ['I2', 'I1'],
      path2: ['I1']
    });
  });

  it('should find the MRCA for siblings', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('P1', createMockNode('P1', 'Parent', [], ['C1', 'C2']));
    graph.set('C1', createMockNode('C1', 'Child 1', ['P1']));
    graph.set('C2', createMockNode('C2', 'Child 2', ['P1']));

    const result = findMRCA(graph, 'C1', 'C2');
    expect(result).toEqual({
      mrcaId: 'P1',
      mrcaName: 'Parent',
      path1: ['C1', 'P1'],
      path2: ['C2', 'P1']
    });
  });

  it('should find the MRCA for cousins', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('GP1', createMockNode('GP1', 'Grandparent', [], ['P1', 'P2']));
    graph.set('P1', createMockNode('P1', 'Parent 1', ['GP1'], ['C1']));
    graph.set('P2', createMockNode('P2', 'Parent 2', ['GP1'], ['C2']));
    graph.set('C1', createMockNode('C1', 'Child 1', ['P1']));
    graph.set('C2', createMockNode('C2', 'Child 2', ['P2']));

    const result = findMRCA(graph, 'C1', 'C2');
    expect(result).toEqual({
      mrcaId: 'GP1',
      mrcaName: 'Grandparent',
      path1: ['C1', 'P1', 'GP1'],
      path2: ['C2', 'P2', 'GP1']
    });
  });

  it('should find the closest MRCA when there are multiple common ancestors', () => {
    const graph: GenealogyGraph = new Map();
    // GGP1 is the great-grandparent
    // GP1 is the grandparent
    // GP1 and GGP1 are both ancestors of C1 and C2, but GP1 is closer
    graph.set('GGP1', createMockNode('GGP1', 'GreatGrandparent', [], ['GP1']));
    graph.set('GP1', createMockNode('GP1', 'Grandparent', ['GGP1'], ['P1', 'P2']));
    graph.set('P1', createMockNode('P1', 'Parent 1', ['GP1'], ['C1']));
    graph.set('P2', createMockNode('P2', 'Parent 2', ['GP1'], ['C2']));
    graph.set('C1', createMockNode('C1', 'Child 1', ['P1']));
    graph.set('C2', createMockNode('C2', 'Child 2', ['P2']));

    const result = findMRCA(graph, 'C1', 'C2');
    expect(result).toEqual({
      mrcaId: 'GP1',
      mrcaName: 'Grandparent',
      path1: ['C1', 'P1', 'GP1'],
      path2: ['C2', 'P2', 'GP1']
    });
  });

  it('should return empty object when there is no common ancestor', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', createMockNode('I1', 'Person 1'));
    graph.set('I2', createMockNode('I2', 'Person 2'));

    const result = findMRCA(graph, 'I1', 'I2');
    expect(result).toEqual({});
  });
});
