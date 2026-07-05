import { describe, it, expect } from 'vitest';
import { matchDNA } from './algorithms';
import { GenealogyGraph, GraphNode } from './graph';
import { DNAMatch } from './parsers';

describe('matchDNA', () => {
  // Setup mock graph
  const graph: GenealogyGraph = new Map();

  const node1: GraphNode = {
    individual: { id: 'I1', name: 'John Smith', givenName: 'John', surname: 'Smith' },
    parents: [],
    children: [],
    spouses: []
  };
  const node2: GraphNode = {
    individual: { id: 'I2', name: 'Jane Doe', givenName: 'Jane', surname: 'Doe' },
    parents: [],
    children: [],
    spouses: []
  };
  const node3: GraphNode = {
    individual: { id: 'I3', name: 'Alice Johnson', givenName: 'Alice', surname: 'Johnson' },
    parents: [],
    children: [],
    spouses: []
  };

  graph.set('I1', node1);
  graph.set('I2', node2);
  graph.set('I3', node3);

  it('finds exact matches', () => {
    const dnaMatches: DNAMatch[] = [{ name: 'John Smith', cM: 100 }];
    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].matchedIndividualName).toBe('John Smith');
  });

  it('finds substring matches', () => {
    // 'Jane' is a substring of 'Jane Doe' in the graph
    // 'Alice Johnson Smith' contains 'Alice Johnson' from the graph
    const dnaMatches: DNAMatch[] = [
      { name: 'Jane', cM: 50 },
      { name: 'Alice Johnson Smith', cM: 25 }
    ];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(2);

    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I2');

    expect(results[1].status).toBe('Localizado');
    expect(results[1].matchedIndividualId).toBe('I3');
  });

  it('finds fuzzy matches using levenshtein distance', () => {
    const dnaMatches: DNAMatch[] = [
      { name: 'Jonn Smith', cM: 75 }, // 1 typo from John Smith
      { name: 'Jan Do', cM: 10 } // 2 typos from Jane Doe
    ];

    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(2);

    expect(results[0].status).toBe('Localizado');
    expect(results[0].matchedIndividualId).toBe('I1');

    expect(results[1].status).toBe('Localizado');
    expect(results[1].matchedIndividualId).toBe('I2');
  });

  it('returns Não Localizado for no match', () => {
    const dnaMatches: DNAMatch[] = [{ name: 'Totally Random Name', cM: 5 }];
    const results = matchDNA(dnaMatches, graph);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('Não Localizado');
    expect(results[0].matchedIndividualId).toBeUndefined();
    expect(results[0].matchedIndividualName).toBeUndefined();
  });
});
