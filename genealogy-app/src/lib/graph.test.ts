import { describe, it, expect } from 'vitest';
import { buildGraph } from './graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from './parsers';

describe('buildGraph', () => {
  it('should return an empty graph for empty input', () => {
    const data: GedcomData = { individuals: new Map(), families: new Map() };
    const graph = buildGraph(data);
    expect(graph.size).toBe(0);
  });

  it('should create nodes for single individuals with no families', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['I1', { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
      ['I2', { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }]
    ]);

    const data: GedcomData = { individuals, families: new Map() };
    const graph = buildGraph(data);

    expect(graph.size).toBe(2);

    const i1Node = graph.get('I1')!;
    expect(i1Node.individual).toEqual(individuals.get('I1'));
    expect(i1Node.parents).toEqual([]);
    expect(i1Node.children).toEqual([]);
    expect(i1Node.spouses).toEqual([]);

    const i2Node = graph.get('I2')!;
    expect(i2Node.individual).toEqual(individuals.get('I2'));
    expect(i2Node.parents).toEqual([]);
    expect(i2Node.children).toEqual([]);
    expect(i2Node.spouses).toEqual([]);
  });

  it('should handle a simple nuclear family', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['I1', { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
      ['I2', { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }],
      ['I3', { id: 'I3', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' }]
    ]);

    const families = new Map<string, GedcomFamily>([
      ['F1', { id: 'F1', husband: 'I1', wife: 'I2', children: ['I3'] }]
    ]);

    const data: GedcomData = { individuals, families };
    const graph = buildGraph(data);

    expect(graph.size).toBe(3);

    const i1Node = graph.get('I1')!;
    expect(i1Node.spouses).toEqual(['I2']);
    expect(i1Node.children).toEqual(['I3']);
    expect(i1Node.parents).toEqual([]);

    const i2Node = graph.get('I2')!;
    expect(i2Node.spouses).toEqual(['I1']);
    expect(i2Node.children).toEqual(['I3']);
    expect(i2Node.parents).toEqual([]);

    const i3Node = graph.get('I3')!;
    expect(i3Node.spouses).toEqual([]);
    expect(i3Node.children).toEqual([]);
    expect(i3Node.parents).toEqual(['I1', 'I2']);
  });

  it('should handle multiple spouses and children', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['I1', { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
      ['I2', { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }], // Wife 1
      ['I3', { id: 'I3', name: 'Mary Smith', givenName: 'Mary', surname: 'Smith' }], // Wife 2
      ['I4', { id: 'I4', name: 'Child One', givenName: 'Child', surname: 'One' }], // Child of I1 & I2
      ['I5', { id: 'I5', name: 'Child Two', givenName: 'Child', surname: 'Two' }]  // Child of I1 & I3
    ]);

    const families = new Map<string, GedcomFamily>([
      ['F1', { id: 'F1', husband: 'I1', wife: 'I2', children: ['I4'] }],
      ['F2', { id: 'F2', husband: 'I1', wife: 'I3', children: ['I5'] }]
    ]);

    const data: GedcomData = { individuals, families };
    const graph = buildGraph(data);

    const i1Node = graph.get('I1')!;
    expect(i1Node.spouses).toEqual(expect.arrayContaining(['I2', 'I3']));
    expect(i1Node.children).toEqual(expect.arrayContaining(['I4', 'I5']));

    const i2Node = graph.get('I2')!;
    expect(i2Node.spouses).toEqual(['I1']);
    expect(i2Node.children).toEqual(['I4']);

    const i3Node = graph.get('I3')!;
    expect(i3Node.spouses).toEqual(['I1']);
    expect(i3Node.children).toEqual(['I5']);

    const i4Node = graph.get('I4')!;
    expect(i4Node.parents).toEqual(expect.arrayContaining(['I1', 'I2']));

    const i5Node = graph.get('I5')!;
    expect(i5Node.parents).toEqual(expect.arrayContaining(['I1', 'I3']));
  });

  it('should prevent duplicate edges', () => {
    const individuals = new Map<string, GedcomIndividual>([
      ['I1', { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' }],
      ['I2', { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' }],
      ['I3', { id: 'I3', name: 'Baby Doe', givenName: 'Baby', surname: 'Doe' }]
    ]);

    // Simulating messy GEDCOM data with duplicate family records or overlapping children
    const families = new Map<string, GedcomFamily>([
      ['F1', { id: 'F1', husband: 'I1', wife: 'I2', children: ['I3', 'I3'] }],
      ['F2', { id: 'F2', husband: 'I1', wife: 'I2', children: ['I3'] }]
    ]);

    const data: GedcomData = { individuals, families };
    const graph = buildGraph(data);

    const i1Node = graph.get('I1')!;
    expect(i1Node.spouses).toEqual(['I2']); // Only one spouse I2
    expect(i1Node.children).toEqual(['I3']); // Only one child I3

    const i3Node = graph.get('I3')!;
    expect(i3Node.parents).toEqual(expect.arrayContaining(['I1', 'I2']));
    expect(i3Node.parents.length).toBe(2); // Only two parents
  });
});
