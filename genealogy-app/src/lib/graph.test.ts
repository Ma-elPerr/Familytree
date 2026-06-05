import { describe, it, expect } from 'vitest';
import { buildGraph } from './graph';
import { GedcomData, GedcomIndividual, GedcomFamily } from './parsers';

describe('buildGraph', () => {
  const createIndividual = (id: string, name: string): GedcomIndividual => ({
    id,
    name,
    givenName: name.split(' ')[0] || '',
    surname: name.split(' ')[1] || '',
  });

  const createFamily = (
    id: string,
    husband: string | undefined,
    wife: string | undefined,
    children: string[]
  ): GedcomFamily => ({
    id,
    husband,
    wife,
    children,
  });

  it('should initialize correctly with only individuals', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['I1', createIndividual('I1', 'John Doe')],
        ['I2', createIndividual('I2', 'Jane Doe')],
      ]),
      families: new Map(),
    };

    const graph = buildGraph(data);

    expect(graph.size).toBe(2);
    expect(graph.get('I1')).toEqual({
      individual: data.individuals.get('I1'),
      parents: [],
      children: [],
      spouses: [],
    });
    expect(graph.get('I2')).toEqual({
      individual: data.individuals.get('I2'),
      parents: [],
      children: [],
      spouses: [],
    });
  });

  it('should correctly link spouses', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['I1', createIndividual('I1', 'Husband')],
        ['I2', createIndividual('I2', 'Wife')],
      ]),
      families: new Map([
        ['F1', createFamily('F1', 'I1', 'I2', [])],
      ]),
    };

    const graph = buildGraph(data);

    expect(graph.get('I1')?.spouses).toEqual(['I2']);
    expect(graph.get('I2')?.spouses).toEqual(['I1']);
    expect(graph.get('I1')?.parents).toEqual([]);
    expect(graph.get('I1')?.children).toEqual([]);
    expect(graph.get('I2')?.parents).toEqual([]);
    expect(graph.get('I2')?.children).toEqual([]);
  });

  it('should correctly link parents and children', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['I1', createIndividual('I1', 'Dad')],
        ['I2', createIndividual('I2', 'Mom')],
        ['I3', createIndividual('I3', 'Child1')],
        ['I4', createIndividual('I4', 'Child2')],
      ]),
      families: new Map([
        ['F1', createFamily('F1', 'I1', 'I2', ['I3', 'I4'])],
      ]),
    };

    const graph = buildGraph(data);

    expect(graph.get('I1')?.children).toEqual(['I3', 'I4']);
    expect(graph.get('I2')?.children).toEqual(['I3', 'I4']);
    expect(graph.get('I3')?.parents).toEqual(['I1', 'I2']);
    expect(graph.get('I4')?.parents).toEqual(['I1', 'I2']);
  });

  it('should handle families missing a husband', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['I2', createIndividual('I2', 'Mom')],
        ['I3', createIndividual('I3', 'Child1')],
      ]),
      families: new Map([
        ['F1', createFamily('F1', undefined, 'I2', ['I3'])],
      ]),
    };

    const graph = buildGraph(data);

    expect(graph.get('I2')?.children).toEqual(['I3']);
    expect(graph.get('I3')?.parents).toEqual(['I2']);
    expect(graph.get('I2')?.spouses).toEqual([]);
  });

  it('should handle families missing a wife', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['I1', createIndividual('I1', 'Dad')],
        ['I3', createIndividual('I3', 'Child1')],
      ]),
      families: new Map([
        ['F1', createFamily('F1', 'I1', undefined, ['I3'])],
      ]),
    };

    const graph = buildGraph(data);

    expect(graph.get('I1')?.children).toEqual(['I3']);
    expect(graph.get('I3')?.parents).toEqual(['I1']);
    expect(graph.get('I1')?.spouses).toEqual([]);
  });

  it('should remove duplicate relationships', () => {
    const data: GedcomData = {
      individuals: new Map([
        ['I1', createIndividual('I1', 'Husband')],
        ['I2', createIndividual('I2', 'Wife')],
        ['I3', createIndividual('I3', 'Child')],
      ]),
      // Duplicate families
      families: new Map([
        ['F1', createFamily('F1', 'I1', 'I2', ['I3'])],
        ['F2', createFamily('F2', 'I1', 'I2', ['I3'])],
      ]),
    };

    const graph = buildGraph(data);

    expect(graph.get('I1')?.spouses).toEqual(['I2']);
    expect(graph.get('I1')?.children).toEqual(['I3']);
    expect(graph.get('I3')?.parents).toEqual(['I1', 'I2']);
  });
});
