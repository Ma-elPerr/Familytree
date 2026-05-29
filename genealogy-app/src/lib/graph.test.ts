import { describe, it, expect } from 'vitest';
import { buildGraph } from './graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from './parsers';

describe('buildGraph', () => {
  it('should initialize empty graph when data has no individuals or families', () => {
    const data: GedcomData = {
      individuals: new Map(),
      families: new Map(),
    };

    const graph = buildGraph(data);

    expect(graph.size).toBe(0);
  });

  it('should initialize nodes for all individuals', () => {
    const ind1: GedcomIndividual = { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const ind2: GedcomIndividual = { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' };

    const individuals = new Map([
      ['I1', ind1],
      ['I2', ind2],
    ]);

    const data: GedcomData = {
      individuals,
      families: new Map(),
    };

    const graph = buildGraph(data);

    expect(graph.size).toBe(2);
    expect(graph.get('I1')).toEqual({ individual: ind1, parents: [], children: [], spouses: [] });
    expect(graph.get('I2')).toEqual({ individual: ind2, parents: [], children: [], spouses: [] });
  });

  it('should populate spouses, parents, and children based on family data', () => {
    const ind1: GedcomIndividual = { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' }; // Husband
    const ind2: GedcomIndividual = { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }; // Wife
    const ind3: GedcomIndividual = { id: 'I3', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' }; // Child

    const individuals = new Map([
      ['I1', ind1],
      ['I2', ind2],
      ['I3', ind3],
    ]);

    const fam1: GedcomFamily = { id: 'F1', husband: 'I1', wife: 'I2', children: ['I3'] };
    const families = new Map([
      ['F1', fam1],
    ]);

    const data: GedcomData = {
      individuals,
      families,
    };

    const graph = buildGraph(data);

    expect(graph.get('I1')?.spouses).toEqual(['I2']);
    expect(graph.get('I1')?.children).toEqual(['I3']);

    expect(graph.get('I2')?.spouses).toEqual(['I1']);
    expect(graph.get('I2')?.children).toEqual(['I3']);

    expect(graph.get('I3')?.parents).toEqual(['I1', 'I2']);
  });

  it('should handle single-parent families properly', () => {
    const ind1: GedcomIndividual = { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' }; // Husband
    const ind3: GedcomIndividual = { id: 'I3', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' }; // Child

    const individuals = new Map([
      ['I1', ind1],
      ['I3', ind3],
    ]);

    const fam1: GedcomFamily = { id: 'F1', husband: 'I1', children: ['I3'] };
    const families = new Map([
      ['F1', fam1],
    ]);

    const data: GedcomData = {
      individuals,
      families,
    };

    const graph = buildGraph(data);

    expect(graph.get('I1')?.spouses).toEqual([]);
    expect(graph.get('I1')?.children).toEqual(['I3']);

    expect(graph.get('I3')?.parents).toEqual(['I1']);
  });

  it('should deduplicate edges if families result in duplicate entries', () => {
    const ind1: GedcomIndividual = { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const ind2: GedcomIndividual = { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' };
    const ind3: GedcomIndividual = { id: 'I3', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' };

    const individuals = new Map([
      ['I1', ind1],
      ['I2', ind2],
      ['I3', ind3],
    ]);

    // Same family duplicated to test deduplication
    const fam1: GedcomFamily = { id: 'F1', husband: 'I1', wife: 'I2', children: ['I3'] };
    const fam2: GedcomFamily = { id: 'F2', husband: 'I1', wife: 'I2', children: ['I3'] };
    const families = new Map([
      ['F1', fam1],
      ['F2', fam2],
    ]);

    const data: GedcomData = {
      individuals,
      families,
    };

    const graph = buildGraph(data);

    expect(graph.get('I1')?.spouses).toEqual(['I2']); // Not ['I2', 'I2']
    expect(graph.get('I1')?.children).toEqual(['I3']); // Not ['I3', 'I3']

    expect(graph.get('I2')?.spouses).toEqual(['I1']);
    expect(graph.get('I2')?.children).toEqual(['I3']);

    expect(graph.get('I3')?.parents).toEqual(['I1', 'I2']); // Not ['I1', 'I2', 'I1', 'I2']
  });
});
