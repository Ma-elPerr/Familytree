import { describe, it, expect } from 'vitest';
import { findDuplicates } from './analysis';
import { GenealogyGraph } from './graph';

describe('findDuplicates', () => {
  it('should return empty when graph is empty', () => {
    const graph: GenealogyGraph = new Map();
    expect(findDuplicates(graph)).toHaveLength(0);
  });

  it('should identify duplicates with same name and birth year', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', birthYear: 1950 },
      parents: [], children: [], spouses: []
    });
    graph.set('I2', {
      individual: { id: 'I2', name: 'John Doe', birthYear: 1950 },
      parents: [], children: [], spouses: []
    });

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].individuals).toEqual(['I1', 'I2']);
    expect(duplicates[0].name).toBe('john doe');
    expect(duplicates[0].birthYear).toBe(1950);
  });

  it('should not group individuals with same name but different birth year', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', birthYear: 1950 },
      parents: [], children: [], spouses: []
    });
    graph.set('I2', {
      individual: { id: 'I2', name: 'John Doe', birthYear: 1980 },
      parents: [], children: [], spouses: []
    });

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(0);
  });

  it('should identify duplicates with same name and both missing birth year', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe' },
      parents: [], children: [], spouses: []
    });
    graph.set('I2', {
      individual: { id: 'I2', name: 'John Doe' },
      parents: [], children: [], spouses: []
    });

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].individuals).toEqual(['I1', 'I2']);
    expect(duplicates[0].name).toBe('john doe');
    expect(duplicates[0].birthYear).toBeUndefined();
  });

  it('should ignore individuals named "Unknown"', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'Unknown', birthYear: 1900 },
      parents: [], children: [], spouses: []
    });
    graph.set('I2', {
      individual: { id: 'I2', name: 'Unknown', birthYear: 1900 },
      parents: [], children: [], spouses: []
    });

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(0);
  });

  it('should ignore individuals named "unknown" (case-insensitive)', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'unknown', birthYear: 1900 },
      parents: [], children: [], spouses: []
    });
    graph.set('I2', {
      individual: { id: 'I2', name: 'UNKNOWN', birthYear: 1900 },
      parents: [], children: [], spouses: []
    });

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(0);
  });

  it('should ignore individuals with empty name', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: '', birthYear: 1900 },
      parents: [], children: [], spouses: []
    });
    graph.set('I2', {
      individual: { id: 'I2', name: '', birthYear: 1900 },
      parents: [], children: [], spouses: []
    });
    graph.set('I3', {
      individual: { id: 'I3', birthYear: 1900 }, // undefined name
      parents: [], children: [], spouses: []
    });

    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(0);
  });
});
