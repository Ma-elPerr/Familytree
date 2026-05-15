import { describe, it, expect } from 'vitest';
import { buildGraph } from '../graph';
import { GedcomData } from '../parsers';

describe('buildGraph', () => {
  it('should handle empty data', () => {
    const data: GedcomData = {
      individuals: new Map(),
      families: new Map(),
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(0);
  });

  it('should create nodes for individuals with no family links', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', { id: '@I1@', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
      ]),
      families: new Map(),
    };

    const graph = buildGraph(data);
    expect(graph.size).toBe(1);

    const node = graph.get('@I1@');
    expect(node).toBeDefined();
    expect(node?.individual.id).toBe('@I1@');
    expect(node?.parents).toEqual([]);
    expect(node?.children).toEqual([]);
    expect(node?.spouses).toEqual([]);
  });

  it('should populate spouses, parents and children correctly for a full family', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', { id: '@I1@', name: 'Husband', givenName: 'Husband', surname: 'H' }],
        ['@I2@', { id: '@I2@', name: 'Wife', givenName: 'Wife', surname: 'W' }],
        ['@I3@', { id: '@I3@', name: 'Child1', givenName: 'Child1', surname: 'C' }],
        ['@I4@', { id: '@I4@', name: 'Child2', givenName: 'Child2', surname: 'C' }],
      ]),
      families: new Map([
        ['@F1@', { id: '@F1@', husband: '@I1@', wife: '@I2@', children: ['@I3@', '@I4@'] }],
      ]),
    };

    const graph = buildGraph(data);

    const husbandNode = graph.get('@I1@');
    const wifeNode = graph.get('@I2@');
    const child1Node = graph.get('@I3@');
    const child2Node = graph.get('@I4@');

    // Check Spouses
    expect(husbandNode?.spouses).toEqual(['@I2@']);
    expect(wifeNode?.spouses).toEqual(['@I1@']);

    // Check Children of Parents
    expect(husbandNode?.children).toEqual(['@I3@', '@I4@']);
    expect(wifeNode?.children).toEqual(['@I3@', '@I4@']);

    // Check Parents of Children
    expect(child1Node?.parents).toEqual(expect.arrayContaining(['@I1@', '@I2@']));
    expect(child1Node?.parents).toHaveLength(2);

    expect(child2Node?.parents).toEqual(expect.arrayContaining(['@I1@', '@I2@']));
    expect(child2Node?.parents).toHaveLength(2);
  });

  it('should handle incomplete families (missing husband)', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['@I2@', { id: '@I2@', name: 'Wife', givenName: 'Wife', surname: 'W' }],
        ['@I3@', { id: '@I3@', name: 'Child1', givenName: 'Child1', surname: 'C' }],
      ]),
      families: new Map([
        ['@F1@', { id: '@F1@', wife: '@I2@', children: ['@I3@'] }], // missing husband
      ]),
    };

    const graph = buildGraph(data);

    const wifeNode = graph.get('@I2@');
    const child1Node = graph.get('@I3@');

    expect(wifeNode?.spouses).toEqual([]);
    expect(wifeNode?.children).toEqual(['@I3@']);
    expect(child1Node?.parents).toEqual(['@I2@']);
  });

  it('should handle incomplete families (missing wife)', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', { id: '@I1@', name: 'Husband', givenName: 'Husband', surname: 'H' }],
        ['@I3@', { id: '@I3@', name: 'Child1', givenName: 'Child1', surname: 'C' }],
      ]),
      families: new Map([
        ['@F1@', { id: '@F1@', husband: '@I1@', children: ['@I3@'] }], // missing wife
      ]),
    };

    const graph = buildGraph(data);

    const husbandNode = graph.get('@I1@');
    const child1Node = graph.get('@I3@');

    expect(husbandNode?.spouses).toEqual([]);
    expect(husbandNode?.children).toEqual(['@I3@']);
    expect(child1Node?.parents).toEqual(['@I1@']);
  });

  it('should handle missing individuals gracefully (not crash if referenced individual does not exist)', () => {
    const data: GedcomData = {
      individuals: new Map([
        // Only wife exists in individuals
        ['@I2@', { id: '@I2@', name: 'Wife', givenName: 'Wife', surname: 'W' }],
      ]),
      families: new Map([
        // Family references non-existent husband and child
        ['@F1@', { id: '@F1@', husband: '@I1@', wife: '@I2@', children: ['@I3@'] }],
      ]),
    };

    // The current logic uses graph.get(id)?.spouses.push(...) so it shouldn't crash
    const graph = buildGraph(data);
    expect(graph.size).toBe(1);

    const wifeNode = graph.get('@I2@');
    expect(wifeNode?.spouses).toEqual(['@I1@']); // @I1@ is added because graph.get(wife) succeeds
    expect(wifeNode?.children).toEqual(['@I3@']); // @I3@ is added because graph.get(wife) succeeds
    // The child and husband don't exist in the graph, so nothing happens to them
    expect(graph.has('@I1@')).toBe(false);
    expect(graph.has('@I3@')).toBe(false);
  });

  it('should deduplicate entries in arrays', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['@I1@', { id: '@I1@', name: 'Husband', givenName: 'Husband', surname: 'H' }],
        ['@I2@', { id: '@I2@', name: 'Wife', givenName: 'Wife', surname: 'W' }],
        ['@I3@', { id: '@I3@', name: 'Child', givenName: 'Child', surname: 'C' }],
      ]),
      families: new Map([
        // Two families with the same parents and children to simulate duplicate edges
        ['@F1@', { id: '@F1@', husband: '@I1@', wife: '@I2@', children: ['@I3@'] }],
        ['@F2@', { id: '@F2@', husband: '@I1@', wife: '@I2@', children: ['@I3@'] }],
        ['@F3@', { id: '@F3@', husband: '@I1@', wife: '@I2@', children: ['@I3@', '@I3@'] }],
      ]),
    };

    const graph = buildGraph(data);

    const husbandNode = graph.get('@I1@');
    const wifeNode = graph.get('@I2@');
    const childNode = graph.get('@I3@');

    expect(husbandNode?.spouses).toEqual(['@I2@']);
    expect(husbandNode?.children).toEqual(['@I3@']);

    expect(wifeNode?.spouses).toEqual(['@I1@']);
    expect(wifeNode?.children).toEqual(['@I3@']);

    expect(childNode?.parents).toHaveLength(2);
    expect(childNode?.parents).toEqual(expect.arrayContaining(['@I1@', '@I2@']));
  });
});
