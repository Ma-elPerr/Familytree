import { describe, it, expect } from 'vitest';
import { findDuplicates } from '../src/lib/analysis';
import { GenealogyGraph } from '../src/lib/graph';

describe('findDuplicates', () => {
  it('should find duplicates based on name and birth year', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', { individual: { id: 'I1', name: 'John Doe', birthYear: 1980 }, parents: [], children: [], spouses: [] });
    graph.set('I2', { individual: { id: 'I2', name: 'John Doe', birthYear: 1980 }, parents: [], children: [], spouses: [] });
    graph.set('I3', { individual: { id: 'I3', name: 'Jane Doe', birthYear: 1982 }, parents: [], children: [], spouses: [] });
    graph.set('I4', { individual: { id: 'I4', name: 'John Doe', birthYear: 1981 }, parents: [], children: [], spouses: [] });

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].name).toBe('john doe');
    expect(duplicates[0].birthYear).toBe(1980);
    expect(duplicates[0].individuals).toEqual(['I1', 'I2']);
  });

  it('should handle names with different casing and whitespace', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', { individual: { id: 'I1', name: 'John Doe', birthYear: 1980 }, parents: [], children: [], spouses: [] });
    graph.set('I2', { individual: { id: 'I2', name: '  JOHN doe ', birthYear: 1980 }, parents: [], children: [], spouses: [] });

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].name).toBe('john doe');
    expect(duplicates[0].individuals).toEqual(['I1', 'I2']);
  });

  it('should handle individuals with unknown birth years', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', { individual: { id: 'I1', name: 'John Doe' }, parents: [], children: [], spouses: [] });
    graph.set('I2', { individual: { id: 'I2', name: 'John Doe' }, parents: [], children: [], spouses: [] });

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].name).toBe('john doe');
    expect(duplicates[0].birthYear).toBeUndefined();
    expect(duplicates[0].individuals).toEqual(['I1', 'I2']);
  });

  it('should ignore individuals with "Unknown" or no name', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', { individual: { id: 'I1', name: 'Unknown', birthYear: 1980 }, parents: [], children: [], spouses: [] });
    graph.set('I2', { individual: { id: 'I2', name: 'Unknown', birthYear: 1980 }, parents: [], children: [], spouses: [] });
    graph.set('I3', { individual: { id: 'I3', name: '', birthYear: 1980 }, parents: [], children: [], spouses: [] });
    graph.set('I4', { individual: { id: 'I4', birthYear: 1980 } as unknown as { id: string; name: string; birthYear?: number }, parents: [], children: [], spouses: [] });

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(0);
  });

  it('should not group individuals with same name but different birth years', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', { individual: { id: 'I1', name: 'John Doe', birthYear: 1980 }, parents: [], children: [], spouses: [] });
    graph.set('I2', { individual: { id: 'I2', name: 'John Doe', birthYear: 1985 }, parents: [], children: [], spouses: [] });
    graph.set('I3', { individual: { id: 'I3', name: 'John Doe' }, parents: [], children: [], spouses: [] });

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(0);
  });
});
