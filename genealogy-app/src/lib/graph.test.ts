import { describe, it, expect } from 'vitest';
import { buildGraph } from './graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from './parsers';

describe('buildGraph', () => {
  it('should handle empty data', () => {
    const data: GedcomData = {
      individuals: new Map(),
      families: new Map()
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(0);
  });

  it('should populate individuals without family connections', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['I1', { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
      ['I2', { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }]
    ]);
    const data: GedcomData = {
      individuals,
      families: new Map()
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(2);

    const node1 = graph.get('I1');
    expect(node1).toBeDefined();
    expect(node1?.parents).toEqual([]);
    expect(node1?.children).toEqual([]);
    expect(node1?.spouses).toEqual([]);
  });

  it('should correctly populate edges for a basic family', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['H1', { id: 'H1', name: 'Husband', givenName: 'H', surname: 'S' }],
      ['W1', { id: 'W1', name: 'Wife', givenName: 'W', surname: 'S' }],
      ['C1', { id: 'C1', name: 'Child 1', givenName: 'C1', surname: 'S' }],
      ['C2', { id: 'C2', name: 'Child 2', givenName: 'C2', surname: 'S' }]
    ]);

    const families = new Map<string, GedcomFamily>([
      ['F1', { id: 'F1', husband: 'H1', wife: 'W1', children: ['C1', 'C2'] }]
    ]);

    const data: GedcomData = { individuals, families };
    const graph = buildGraph(data);

    // Check Spouses
    expect(graph.get('H1')?.spouses).toEqual(['W1']);
    expect(graph.get('W1')?.spouses).toEqual(['H1']);

    // Check Parents -> Children
    expect(graph.get('H1')?.children).toEqual(['C1', 'C2']);
    expect(graph.get('W1')?.children).toEqual(['C1', 'C2']);

    // Check Children -> Parents
    expect(graph.get('C1')?.parents).toEqual(['H1', 'W1']);
    expect(graph.get('C2')?.parents).toEqual(['H1', 'W1']);
  });

  it('should correctly handle partial families (single parent)', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['P1', { id: 'P1', name: 'Parent', givenName: 'P', surname: 'S' }],
      ['C1', { id: 'C1', name: 'Child', givenName: 'C', surname: 'S' }]
    ]);

    const families = new Map<string, GedcomFamily>([
      ['F1', { id: 'F1', wife: 'P1', children: ['C1'] }] // No husband
    ]);

    const data: GedcomData = { individuals, families };
    const graph = buildGraph(data);

    // Check Spouses
    expect(graph.get('P1')?.spouses).toEqual([]);

    // Check Parents -> Children
    expect(graph.get('P1')?.children).toEqual(['C1']);

    // Check Children -> Parents
    expect(graph.get('C1')?.parents).toEqual(['P1']);
  });

  it('should eliminate duplicate edges', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['H1', { id: 'H1', name: 'Husband', givenName: 'H', surname: 'S' }],
      ['W1', { id: 'W1', name: 'Wife', givenName: 'W', surname: 'S' }],
      ['C1', { id: 'C1', name: 'Child', givenName: 'C', surname: 'S' }]
    ]);

    // Simulating messy data with duplicate family definitions for the same structure
    const families = new Map<string, GedcomFamily>([
      ['F1', { id: 'F1', husband: 'H1', wife: 'W1', children: ['C1'] }],
      ['F2', { id: 'F2', husband: 'H1', wife: 'W1', children: ['C1'] }]
    ]);

    const data: GedcomData = { individuals, families };
    const graph = buildGraph(data);

    expect(graph.get('H1')?.spouses).toEqual(['W1']);
    expect(graph.get('H1')?.children).toEqual(['C1']);
    expect(graph.get('C1')?.parents).toEqual(['H1', 'W1']);
  });
});
