import { describe, it, expect } from 'vitest';
import { buildGraph } from '../lib/graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from '../lib/parsers';

describe('buildGraph', () => {
  it('should build a graph linking spouses, parents, and children correctly', () => {
    const husband: GedcomIndividual = { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const wife: GedcomIndividual = { id: 'I2', name: 'Jane Smith', givenName: 'Jane', surname: 'Smith' };
    const child1: GedcomIndividual = { id: 'I3', name: 'Jimmy Doe', givenName: 'Jimmy', surname: 'Doe' };
    const child2: GedcomIndividual = { id: 'I4', name: 'Jenny Doe', givenName: 'Jenny', surname: 'Doe' };

    const family: GedcomFamily = {
      id: 'F1',
      husband: 'I1',
      wife: 'I2',
      children: ['I3', 'I4']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['I1', husband],
        ['I2', wife],
        ['I3', child1],
        ['I4', child2]
      ]),
      families: new Map([
        ['F1', family]
      ])
    };

    const graph = buildGraph(data);

    // Verify nodes exist
    expect(graph.has('I1')).toBe(true);
    expect(graph.has('I2')).toBe(true);
    expect(graph.has('I3')).toBe(true);
    expect(graph.has('I4')).toBe(true);

    // Verify spouses
    expect(graph.get('I1')?.spouses).toEqual(['I2']);
    expect(graph.get('I2')?.spouses).toEqual(['I1']);

    // Verify children
    expect(graph.get('I1')?.children).toEqual(['I3', 'I4']);
    expect(graph.get('I2')?.children).toEqual(['I3', 'I4']);

    // Verify parents
    expect(graph.get('I3')?.parents).toEqual(['I1', 'I2']);
    expect(graph.get('I4')?.parents).toEqual(['I1', 'I2']);
  });

  it('should handle families with only one parent', () => {
    const parent: GedcomIndividual = { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const child: GedcomIndividual = { id: 'I2', name: 'Jimmy Doe', givenName: 'Jimmy', surname: 'Doe' };

    const family: GedcomFamily = {
      id: 'F1',
      husband: 'I1',
      // wife missing
      children: ['I2']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['I1', parent],
        ['I2', child]
      ]),
      families: new Map([
        ['F1', family]
      ])
    };

    const graph = buildGraph(data);

    // Verify spouses (should be empty)
    expect(graph.get('I1')?.spouses).toEqual([]);

    // Verify children
    expect(graph.get('I1')?.children).toEqual(['I2']);

    // Verify parents
    expect(graph.get('I2')?.parents).toEqual(['I1']);
  });

  it('should remove duplicates from spouses, parents, and children arrays', () => {
    const husband: GedcomIndividual = { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const wife: GedcomIndividual = { id: 'I2', name: 'Jane Smith', givenName: 'Jane', surname: 'Smith' };
    const child: GedcomIndividual = { id: 'I3', name: 'Jimmy Doe', givenName: 'Jimmy', surname: 'Doe' };

    // Deliberately duplicate the family to simulate duplicated entries in raw GEDCOM data
    const family1: GedcomFamily = {
      id: 'F1',
      husband: 'I1',
      wife: 'I2',
      children: ['I3', 'I3'] // Duplicated child within family
    };

    const family2: GedcomFamily = {
      id: 'F2',
      husband: 'I1',
      wife: 'I2',
      children: ['I3']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['I1', husband],
        ['I2', wife],
        ['I3', child]
      ]),
      families: new Map([
        ['F1', family1],
        ['F2', family2]
      ])
    };

    const graph = buildGraph(data);

    // Verify spouses are deduplicated
    expect(graph.get('I1')?.spouses).toEqual(['I2']); // Not ['I2', 'I2']
    expect(graph.get('I2')?.spouses).toEqual(['I1']);

    // Verify children are deduplicated
    expect(graph.get('I1')?.children).toEqual(['I3']); // Not ['I3', 'I3', 'I3']
    expect(graph.get('I2')?.children).toEqual(['I3']);

    // Verify parents are deduplicated
    expect(graph.get('I3')?.parents).toEqual(['I1', 'I2']); // Not ['I1', 'I2', 'I1', 'I2']
  });
});
