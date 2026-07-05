import { describe, it, expect } from 'vitest';
import { findFloatingTrees } from './analysis';
import { GenealogyGraph, GraphNode } from './graph';

describe('findFloatingTrees', () => {
  it('should find disconnected components as floating trees', () => {
    const graph: GenealogyGraph = new Map();

    // Component 1: I1 and I2 connected (I1 is parent of I2)
    const node1: GraphNode = {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [],
      children: ['I2'],
      spouses: []
    };
    const node2: GraphNode = {
      individual: { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' },
      parents: ['I1'],
      children: [],
      spouses: []
    };

    // Component 2: I3 disconnected
    const node3: GraphNode = {
      individual: { id: 'I3', name: 'Bob Smith', givenName: 'Bob', surname: 'Smith' },
      parents: [],
      children: [],
      spouses: []
    };

    graph.set('I1', node1);
    graph.set('I2', node2);
    graph.set('I3', node3);

    const trees = findFloatingTrees(graph);

    // Expect 2 floating trees (components)
    expect(trees.length).toBe(2);

    // Verify properties of the floating trees
    const tree1 = trees.find(t => t.members.includes('I1'));
    expect(tree1).toBeDefined();
    expect(tree1?.size).toBe(2);
    expect(tree1?.members).toContain('I1');
    expect(tree1?.members).toContain('I2');

    const tree2 = trees.find(t => t.members.includes('I3'));
    expect(tree2).toBeDefined();
    expect(tree2?.size).toBe(1);
    expect(tree2?.members).toContain('I3');
  });

  it('should filter out the main tree when mainTreeRootId is provided', () => {
    const graph: GenealogyGraph = new Map();

    // Component 1: I1 and I2 connected
    const node1: GraphNode = {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [],
      children: ['I2'],
      spouses: []
    };
    const node2: GraphNode = {
      individual: { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' },
      parents: ['I1'],
      children: [],
      spouses: []
    };

    // Component 2: I3 disconnected
    const node3: GraphNode = {
      individual: { id: 'I3', name: 'Bob Smith', givenName: 'Bob', surname: 'Smith' },
      parents: [],
      children: [],
      spouses: []
    };

    graph.set('I1', node1);
    graph.set('I2', node2);
    graph.set('I3', node3);

    // I1 is in the main tree
    const trees = findFloatingTrees(graph, 'I1');

    // Expect 1 floating tree (the other component)
    expect(trees.length).toBe(1);

    const tree2 = trees[0];
    expect(tree2.size).toBe(1);
    expect(tree2.members).toContain('I3');
    expect(tree2.members).not.toContain('I1');
    expect(tree2.members).not.toContain('I2');
  });
});
