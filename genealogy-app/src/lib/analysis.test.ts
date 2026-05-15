import { findDuplicates } from './analysis';
import { GenealogyGraph } from './graph';

describe('findDuplicates', () => {
  it('groups individuals with the same name and empty birth year together', () => {
    const graph: GenealogyGraph = new Map();

    graph.set('I1', {
      id: 'I1',
      individual: { name: 'John Doe' },
      parents: [],
      children: [],
      spouses: []
    });

    graph.set('I2', {
      id: 'I2',
      individual: { name: 'John Doe' },
      parents: [],
      children: [],
      spouses: []
    });

    graph.set('I3', {
      id: 'I3',
      individual: { name: 'John Doe', birthYear: 1900 },
      parents: [],
      children: [],
      spouses: []
    });

    graph.set('I4', {
      id: 'I4',
      individual: { name: 'Jane Doe' },
      parents: [],
      children: [],
      spouses: []
    });

    const duplicates = findDuplicates(graph);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toEqual({
      name: 'john doe',
      birthYear: undefined,
      individuals: ['I1', 'I2']
    });
  });
});
