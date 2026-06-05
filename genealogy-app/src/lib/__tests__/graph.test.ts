import { describe, it, expect } from 'vitest';
import { buildGraph } from '../graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from '../parsers';

describe('buildGraph', () => {

  it('should return an empty graph for empty data', () => {
    const data: GedcomData = {
      individuals: new Map(),
      families: new Map()
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(0);
  });

  it('should initialize nodes for individuals with empty relationships', () => {
    const ind: GedcomIndividual = {
      id: '@I1@',
      name: 'John Doe',
      givenName: 'John',
      surname: 'Doe'
    };

    const data: GedcomData = {
      individuals: new Map([['@I1@', ind]]),
      families: new Map()
    };

    const graph = buildGraph(data);

    expect(graph.size).toBe(1);
    const node = graph.get('@I1@');
    expect(node).toBeDefined();
    expect(node?.individual).toEqual(ind);
    expect(node?.parents).toEqual([]);
    expect(node?.children).toEqual([]);
    expect(node?.spouses).toEqual([]);
  });

  it('should populate spouses properly based on families', () => {
    const husband: GedcomIndividual = { id: '@I1@', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const wife: GedcomIndividual = { id: '@I2@', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' };

    const family: GedcomFamily = {
      id: '@F1@',
      husband: '@I1@',
      wife: '@I2@',
      children: []
    };

    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', husband],
        ['@I2@', wife]
      ]),
      families: new Map([['@F1@', family]])
    };

    const graph = buildGraph(data);

    expect(graph.get('@I1@')?.spouses).toEqual(['@I2@']);
    expect(graph.get('@I2@')?.spouses).toEqual(['@I1@']);
  });

  it('should populate parents and children properly based on families', () => {
    const husband: GedcomIndividual = { id: '@I1@', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const wife: GedcomIndividual = { id: '@I2@', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' };
    const child: GedcomIndividual = { id: '@I3@', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' };

    const family: GedcomFamily = {
      id: '@F1@',
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
      families: new Map([['@F1@', family]])
    };

    const graph = buildGraph(data);

    expect(graph.get('@I1@')?.children).toEqual(['@I3@']);
    expect(graph.get('@I2@')?.children).toEqual(['@I3@']);
    expect(graph.get('@I3@')?.parents).toEqual(['@I1@', '@I2@']);
  });

  it('should handle families with only one spouse', () => {
    const mother: GedcomIndividual = { id: '@I2@', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' };
    const child: GedcomIndividual = { id: '@I3@', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' };

    const family: GedcomFamily = {
      id: '@F1@',
      wife: '@I2@',
      children: ['@I3@']
    };

    const data: GedcomData = {
      individuals: new Map([
        ['@I2@', mother],
        ['@I3@', child]
      ]),
      families: new Map([['@F1@', family]])
    };

    const graph = buildGraph(data);

    expect(graph.get('@I2@')?.children).toEqual(['@I3@']);
    expect(graph.get('@I3@')?.parents).toEqual(['@I2@']);
    expect(graph.get('@I2@')?.spouses).toEqual([]);
  });

  it('should deduplicate relationships', () => {
    const husband: GedcomIndividual = { id: '@I1@', name: 'John Doe', givenName: 'John', surname: 'Doe' };
    const wife: GedcomIndividual = { id: '@I2@', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' };
    const child: GedcomIndividual = { id: '@I3@', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' };

    const family1: GedcomFamily = {
      id: '@F1@',
      husband: '@I1@',
      wife: '@I2@',
      children: ['@I3@']
    };

    // Duplicate family record to simulate duplicate data
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

    // Relationships should only contain unique IDs
    expect(graph.get('@I1@')?.spouses).toEqual(['@I2@']);
    expect(graph.get('@I2@')?.spouses).toEqual(['@I1@']);
    expect(graph.get('@I1@')?.children).toEqual(['@I3@']);
    expect(graph.get('@I3@')?.parents).toEqual(['@I1@', '@I2@']);
  });
});
