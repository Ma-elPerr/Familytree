import { describe, it, expect } from 'vitest';
import { buildGraph } from './graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from './parsers';

describe('buildGraph', () => {
  it('should initialize an empty graph when provided empty data', () => {
    const data: GedcomData = {
      individuals: new Map(),
      families: new Map()
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(0);
  });

  it('should correctly initialize nodes for individuals without relationships', () => {
    const ind1: GedcomIndividual = { id: '@I1@', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const ind2: GedcomIndividual = { id: '@I2@', name: 'Jane Smith', givenName: 'Jane', surname: 'Smith' };

    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', ind1],
        ['@I2@', ind2]
      ]),
      families: new Map()
    };

    const graph = buildGraph(data);

    expect(graph.size).toBe(2);
    expect(graph.get('@I1@')).toEqual({
      individual: ind1,
      parents: [],
      children: [],
      spouses: []
    });
    expect(graph.get('@I2@')).toEqual({
      individual: ind2,
      parents: [],
      children: [],
      spouses: []
    });
  });

  it('should build edges correctly for a standard family with parents and children', () => {
    const husband: GedcomIndividual = { id: '@I1@', name: 'Husband', givenName: 'Husband', surname: 'Smith' };
    const wife: GedcomIndividual = { id: '@I2@', name: 'Wife', givenName: 'Wife', surname: 'Smith' };
    const child1: GedcomIndividual = { id: '@I3@', name: 'Child 1', givenName: 'Child', surname: 'Smith' };
    const child2: GedcomIndividual = { id: '@I4@', name: 'Child 2', givenName: 'Child', surname: 'Smith' };

    const family: GedcomFamily = {
      id: '@F1@',
      husband: '@I1@',
      wife: '@I2@',
      children: ['@I3@', '@I4@']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', husband],
        ['@I2@', wife],
        ['@I3@', child1],
        ['@I4@', child2]
      ]),
      families: new Map([
        ['@F1@', family]
      ])
    };

    const graph = buildGraph(data);

    // Check Spouses
    expect(graph.get('@I1@')?.spouses).toEqual(['@I2@']);
    expect(graph.get('@I2@')?.spouses).toEqual(['@I1@']);

    // Check Husband's children
    expect(graph.get('@I1@')?.children).toEqual(['@I3@', '@I4@']);
    // Check Wife's children
    expect(graph.get('@I2@')?.children).toEqual(['@I3@', '@I4@']);

    // Check Children's parents
    expect(graph.get('@I3@')?.parents).toEqual(['@I1@', '@I2@']);
    expect(graph.get('@I4@')?.parents).toEqual(['@I1@', '@I2@']);
  });

  it('should handle single parent families (only husband or only wife)', () => {
    const husband: GedcomIndividual = { id: '@I1@', name: 'Single Father', givenName: 'Father', surname: 'Jones' };
    const child1: GedcomIndividual = { id: '@I2@', name: 'Child 1', givenName: 'Child', surname: 'Jones' };

    const family1: GedcomFamily = {
      id: '@F1@',
      husband: '@I1@',
      children: ['@I2@']
    };

    const wife: GedcomIndividual = { id: '@I3@', name: 'Single Mother', givenName: 'Mother', surname: 'Brown' };
    const child2: GedcomIndividual = { id: '@I4@', name: 'Child 2', givenName: 'Child', surname: 'Brown' };

    const family2: GedcomFamily = {
      id: '@F2@',
      wife: '@I3@',
      children: ['@I4@']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', husband],
        ['@I2@', child1],
        ['@I3@', wife],
        ['@I4@', child2]
      ]),
      families: new Map([
        ['@F1@', family1],
        ['@F2@', family2]
      ])
    };

    const graph = buildGraph(data);

    // Husband only family checks
    expect(graph.get('@I1@')?.spouses).toEqual([]);
    expect(graph.get('@I1@')?.children).toEqual(['@I2@']);
    expect(graph.get('@I2@')?.parents).toEqual(['@I1@']);

    // Wife only family checks
    expect(graph.get('@I3@')?.spouses).toEqual([]);
    expect(graph.get('@I3@')?.children).toEqual(['@I4@']);
    expect(graph.get('@I4@')?.parents).toEqual(['@I3@']);
  });

  it('should remove duplicate edges when individuals are referenced multiple times', () => {
    const husband: GedcomIndividual = { id: '@I1@', name: 'Husband', givenName: 'Husband', surname: 'Smith' };
    const wife: GedcomIndividual = { id: '@I2@', name: 'Wife', givenName: 'Wife', surname: 'Smith' };
    const child: GedcomIndividual = { id: '@I3@', name: 'Child', givenName: 'Child', surname: 'Smith' };

    // Family with duplicated child references
    const family1: GedcomFamily = {
      id: '@F1@',
      husband: '@I1@',
      wife: '@I2@',
      children: ['@I3@', '@I3@']
    };

    // Another family describing the same relationship
    const family2: GedcomFamily = {
      id: '@F2@',
      husband: '@I1@',
      wife: '@I2@',
      children: ['@I3@']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', husband],
        ['@I2@', wife],
        ['@I3@', child]
      ]),
      families: new Map([
        ['@F1@', family1],
        ['@F2@', family2]
      ])
    };

    const graph = buildGraph(data);

    // The duplicate relationships should be filtered down to unique sets
    expect(graph.get('@I1@')?.spouses).toEqual(['@I2@']);
    expect(graph.get('@I1@')?.children).toEqual(['@I3@']);
    expect(graph.get('@I2@')?.spouses).toEqual(['@I1@']);
    expect(graph.get('@I2@')?.children).toEqual(['@I3@']);
    expect(graph.get('@I3@')?.parents).toEqual(['@I1@', '@I2@']);
  });

  it('should not throw when families reference non-existent individuals', () => {
    // This tests the optional chaining used in the buildGraph function
    const child: GedcomIndividual = { id: '@I3@', name: 'Child', givenName: 'Child', surname: 'Smith' };

    const family: GedcomFamily = {
      id: '@F1@',
      husband: '@I1_MISSING@',
      wife: '@I2_MISSING@',
      children: ['@I3@', '@I4_MISSING@']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['@I3@', child]
      ]),
      families: new Map([
        ['@F1@', family]
      ])
    };

    const graph = buildGraph(data);

    // The graph should only contain @I3@ and its parents should be the missing IDs
    expect(graph.size).toBe(1);
    expect(graph.get('@I3@')?.parents).toEqual(['@I1_MISSING@', '@I2_MISSING@']);
  });
});
