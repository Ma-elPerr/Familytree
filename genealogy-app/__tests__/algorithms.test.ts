import { describe, it, expect } from 'vitest';
import { matchDNA } from '../src/lib/algorithms';
import { GenealogyGraph } from '../src/lib/graph';
import { DNAMatch } from '../src/lib/parsers';

describe('matchDNA', () => {
  it('should find exact matches', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    });

    const dnaMatches: DNAMatch[] = [
      { name: 'John Doe', cM: 100 }
    ];

    const results = matchDNA(dnaMatches, graph);
    expect(results.length).toBe(1);
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].status).toBe('Localizado');
  });

  it('should find fuzzy matches within Levenshtein threshold', () => {
    const graph: GenealogyGraph = new Map();
    // Name is "Patricia Perrucci"
    graph.set('I1', {
      individual: { id: 'I1', name: 'Patricia Perrucci', givenName: 'Patricia', surname: 'Perrucci' },
      parents: [], children: [], spouses: []
    });

    const dnaMatches: DNAMatch[] = [
      // Typo "Patrica Perucci"
      { name: 'Patrica Perucci', cM: 50 }
    ];

    const results = matchDNA(dnaMatches, graph);
    expect(results.length).toBe(1);
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].status).toBe('Localizado');
  });

  it('should not find fuzzy matches outside Levenshtein threshold', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'Patricia', givenName: 'Patricia', surname: '' },
      parents: [], children: [], spouses: []
    });

    const dnaMatches: DNAMatch[] = [
      // Completely different name
      { name: 'Johannes', cM: 50 }
    ];

    const results = matchDNA(dnaMatches, graph);
    expect(results.length).toBe(1);
    expect(results[0].matchedIndividualId).toBeUndefined();
    expect(results[0].status).toBe('Não Localizado');
  });

  it('should find inclusion matches', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe Smith', givenName: 'John Doe', surname: 'Smith' },
      parents: [], children: [], spouses: []
    });

    const dnaMatches: DNAMatch[] = [
      // Name included in the graph node
      { name: 'John Doe', cM: 50 }
    ];

    const results = matchDNA(dnaMatches, graph);
    expect(results.length).toBe(1);
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].status).toBe('Localizado');
  });

  it('should find inclusion matches reversed', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John', givenName: 'John', surname: '' },
      parents: [], children: [], spouses: []
    });

    const dnaMatches: DNAMatch[] = [
      // Graph node name included in the DNA match
      { name: 'John Doe', cM: 50 }
    ];

    const results = matchDNA(dnaMatches, graph);
    expect(results.length).toBe(1);
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].status).toBe('Localizado');
  });

  it('should ignore case and special characters during normalization', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'João Da Silva!', givenName: 'João', surname: 'Da Silva!' },
      parents: [], children: [], spouses: []
    });

    const dnaMatches: DNAMatch[] = [
      // Different case and no special char
      { name: 'joao da silva', cM: 50 }
    ];

    const results = matchDNA(dnaMatches, graph);
    expect(results.length).toBe(1);
    expect(results[0].matchedIndividualId).toBe('I1');
    expect(results[0].status).toBe('Localizado');
  });

  it('should handle non-matches properly', () => {
    const graph: GenealogyGraph = new Map();
    graph.set('I1', {
      individual: { id: 'I1', name: 'John Doe', givenName: 'John', surname: 'Doe' },
      parents: [], children: [], spouses: []
    });

    const dnaMatches: DNAMatch[] = [
      { name: 'Jane Smith', cM: 10 }
    ];

    const results = matchDNA(dnaMatches, graph);
    expect(results.length).toBe(1);
    expect(results[0].matchedIndividualId).toBeUndefined();
    expect(results[0].status).toBe('Não Localizado');
  });
});
